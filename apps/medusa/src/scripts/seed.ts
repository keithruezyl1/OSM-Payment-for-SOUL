import {
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createProductTagsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from '@medusajs/core-flows';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { createCollectionsWorkflow } from '@medusajs/medusa/core-flows';
import type {
  ExecArgs,
  IFulfillmentModuleService,
  IProductModuleService,
  ISalesChannelModuleService,
  IStoreModuleService,
} from '@medusajs/types';
import { SELLER_MODULE } from '../modules/seller';
import { seedProducts, SELLER_HANDLE_BY_TITLE } from './seed/products';

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);
  const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService: ISalesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService: IStoreModuleService = container.resolve(Modules.STORE);

  const philippineCountries = ['ph'];
  const americanCountries = ['us'];
  const allCountries = [...philippineCountries, ...americanCountries];

  logger.info('Seeding store data...');

  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: 'Default Sales Channel',
  });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: 'Default Sales Channel',
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: 'usd',
            is_default: true,
          },
          {
            currency_code: 'php',
          },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info('Seeding region data...');

  const regionModuleService = container.resolve(Modules.REGION) as {
    listRegions: (
      filters?: Record<string, unknown>,
      config?: Record<string, unknown>,
    ) => Promise<Array<{ id: string; name: string; currency_code: string; countries?: Array<{ iso_2: string }> }>>;
  };

  const findRegionByCountry = (
    regions: Array<{ id: string; name: string; currency_code: string; countries?: Array<{ iso_2: string }> }>,
    countryCode: string,
  ) => regions.find((region) => region.countries?.some((country) => country.iso_2 === countryCode));

  let existingRegions = await regionModuleService.listRegions({}, { relations: ['countries'] });
  let usRegion = findRegionByCountry(existingRegions, 'us');
  let phRegion = findRegionByCountry(existingRegions, 'ph');

  if (!usRegion || !phRegion) {
    try {
      const { result: regionResult } = await createRegionsWorkflow(container).run({
        input: {
          regions: [
            {
              name: 'United States',
              currency_code: 'usd',
              countries: americanCountries,
              payment_providers: ['pp_stripe_stripe'],
            },
            {
              name: 'Philippines',
              currency_code: 'php',
              countries: philippineCountries,
              payment_providers: ['pp_stripe_stripe'],
            },
          ],
        },
      });

      usRegion = regionResult.find((region) => region.currency_code === 'usd');
      phRegion = regionResult.find((region) => region.currency_code === 'php');
    } catch (error) {
      // Re-seed safety: countries can already be assigned in existing regions.
      const errorMessage = error instanceof Error ? error.message : '';
      if (!errorMessage.includes('already assigned to a region')) {
        throw error;
      }
      existingRegions = await regionModuleService.listRegions({}, { relations: ['countries'] });
      usRegion = findRegionByCountry(existingRegions, 'us');
      phRegion = findRegionByCountry(existingRegions, 'ph');
    }
  }

  if (!usRegion || !phRegion) {
    throw new Error('Unable to resolve US/PH regions for shipping and pricing.');
  }

  logger.info('Finished seeding regions.');

  logger.info('Seeding tax regions...');

  const taxModuleService = container.resolve(Modules.TAX) as {
    listTaxRegions: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<any[]>;
  };

  const existingTaxRegions = await taxModuleService.listTaxRegions({}, { take: 1000 });
  const existingTaxCountryCodes = new Set(
    existingTaxRegions
      .map((region) => region.country_code as string | undefined)
      .filter((countryCode): countryCode is string => !!countryCode),
  );

  const missingTaxCountries = allCountries.filter((country_code) => !existingTaxCountryCodes.has(country_code));

  if (missingTaxCountries.length) {
    await createTaxRegionsWorkflow(container).run({
      input: missingTaxCountries.map((country_code) => ({
        country_code,
      })),
    });
  }

  logger.info('Finished seeding tax regions.');

  logger.info('Seeding stock location data...');

  const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: 'South Lamar Location',
          address: {
            city: 'Austin',
            country_code: 'US',
            province: 'TX',
            address_1: '1200 S Lamar Blvd',
            postal_code: '78704',
          },
        },
      ],
    },
  });
  // const europeanStockLocation = stockLocationResult[0];
  const americanStockLocation = stockLocationResult[0];

  await remoteLink.create([
    {
      [Modules.STOCK_LOCATION]: {
        stock_location_id: americanStockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: 'manual_manual',
      },
    },
  ]);

  logger.info('Seeding fulfillment data...');
  type ShippingProfileLike = { id: string; name?: string; type?: string };

  const listDefaultShippingProfile = async (): Promise<ShippingProfileLike | undefined> => {
    const service = fulfillmentModuleService as any;
    if (typeof service.listShippingProfiles !== 'function') {
      return undefined;
    }

    const profiles = (await service.listShippingProfiles({}, { take: 100 })) as ShippingProfileLike[];
    return profiles.find((profile) => profile.name === 'Default');
  };

  let shippingProfile = await listDefaultShippingProfile();

  if (!shippingProfile) {
    try {
      const { result: shippingProfileResult } = await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: 'Default',
              type: 'default',
            },
          ],
        },
      });

      shippingProfile = shippingProfileResult[0];
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof (error as any)?.message === 'string'
            ? (error as any).message
            : String(error ?? '');
      if (!errorMessage.includes('already exists')) {
        throw error;
      }
      shippingProfile = await listDefaultShippingProfile();
    }
  }

  if (!shippingProfile?.id) {
    throw new Error('Unable to resolve "Default" shipping profile.');
  }

  type FulfillmentSetLike = {
    id: string;
    name?: string;
    service_zones?: Array<{
      id: string;
      name?: string;
      geo_zones?: Array<{ country_code?: string }>;
    }>;
  };

  const listFulfillmentSetsWithZones = async (): Promise<FulfillmentSetLike[]> => {
    const service = fulfillmentModuleService as any;
    if (typeof service.listFulfillmentSets !== 'function') {
      return [];
    }
    return (await service.listFulfillmentSets({}, { relations: ['service_zones.geo_zones'], take: 100 })) as FulfillmentSetLike[];
  };

  const hasCountryZone = (set: FulfillmentSetLike, countryCode: string) =>
    !!set.service_zones?.some((zone) =>
      zone.geo_zones?.some((geoZone) => geoZone.country_code?.toLowerCase() === countryCode),
    );

  let marketplaceFulfillmentSet = (await listFulfillmentSetsWithZones()).find(
    (set) => set.name === 'Marketplace delivery' && hasCountryZone(set, 'us') && hasCountryZone(set, 'ph'),
  );

  if (!marketplaceFulfillmentSet) {
    try {
      marketplaceFulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
        name: 'Marketplace delivery',
        type: 'shipping',
        service_zones: [
          {
            name: 'Marketplace Zone',
            geo_zones: [
              {
                country_code: 'us',
                type: 'country',
              },
              {
                country_code: 'ph',
                type: 'country',
              },
            ],
          },
        ],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error ?? '');
      if (!errorMessage.toLowerCase().includes('already exists')) {
        throw error;
      }
      marketplaceFulfillmentSet = (await listFulfillmentSetsWithZones()).find(
        (set) => hasCountryZone(set, 'us') && hasCountryZone(set, 'ph'),
      );
    }
  }

  const marketplaceServiceZoneId = marketplaceFulfillmentSet?.service_zones?.[0]?.id;
  if (!marketplaceFulfillmentSet?.id || !marketplaceServiceZoneId) {
    throw new Error('Unable to resolve fulfillment set/service zone for US and PH.');
  }

  try {
    await remoteLink.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: americanStockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_set_id: marketplaceFulfillmentSet.id,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error ?? '');
    if (!errorMessage.includes("Cannot create multiple links between 'stock_location' and 'fulfillment'")) {
      throw error;
    }
  }

  const desiredCollections = [
    {
      title: 'New Arrivals',
      handle: 'new-arrivals',
    },
    {
      title: 'Best Sellers',
      handle: 'best-sellers',
    },
    {
      title: 'Trending',
      handle: 'trending',
    },
    {
      title: 'Sale',
      handle: 'sale',
    },
    {
      title: 'Seasonal',
      handle: 'seasonal',
    },
    {
      title: 'Essentials',
      handle: 'essentials',
    },
  ];

  const existingCollections = await productModuleService.listProductCollections({}, { take: 500 });
  const existingCollectionByHandle = new Map(
    existingCollections
      .map((collection) => [collection.handle, collection.id] as const)
      .filter(([handle, id]) => !!handle && !!id),
  );

  const collectionsResult = await productModuleService.upsertProductCollections(
    desiredCollections.map((collection) => {
      const existingId = existingCollectionByHandle.get(collection.handle);
      return existingId ? { ...collection, id: existingId } : collection;
    }),
  );

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: 'Standard Shipping',
        price_type: 'flat',
        provider_id: 'manual_manual',
        service_zone_id: marketplaceServiceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: 'Standard',
          description: 'Ship in 2-3 days.',
          code: 'standard',
        },
        prices: [
          {
            currency_code: 'usd',
            amount: 5,
          },
          {
            currency_code: 'php',
            amount: 5 * 58,
          },
          {
            region_id: usRegion.id,
            amount: 5,
          },
          {
            region_id: phRegion.id,
            amount: 5 * 58,
          },
        ],
        rules: [
          {
            attribute: 'enabled_in_store',
            value: 'true',
            operator: 'eq',
          },
          {
            attribute: 'is_return',
            value: 'false',
            operator: 'eq',
          },
        ],
      },
      {
        name: 'Express Shipping',
        price_type: 'flat',
        provider_id: 'manual_manual',
        service_zone_id: marketplaceServiceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: 'Express',
          description: 'Ship in 24 hours.',
          code: 'express',
        },
        prices: [
          {
            currency_code: 'usd',
            amount: 10,
          },
          {
            currency_code: 'php',
            amount: 10 * 58,
          },
          {
            region_id: usRegion.id,
            amount: 10,
          },
          {
            region_id: phRegion.id,
            amount: 10 * 58,
          },
        ],
        rules: [
          {
            attribute: 'enabled_in_store',
            value: 'true',
            operator: 'eq',
          },
          {
            attribute: 'is_return',
            value: 'false',
            operator: 'eq',
          },
        ],
      },
    ],
  });

  logger.info('Finished seeding fulfillment data.');

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: americanStockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });

  logger.info('Finished seeding stock location data.');

  logger.info('Seeding publishable API key data...');
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: 'Storefront',
          type: 'publishable',
          created_by: '',
        },
      ],
    },
  });
  const publishableApiKey = publishableApiKeyResult[0];

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });

  logger.info('Finished seeding publishable API key data.');

  logger.info('Seeding product data...');

  const desiredCategories = [
    { name: 'Women', handle: 'women', is_active: true },
    { name: 'Men', handle: 'men', is_active: true },
    { name: 'Kids', handle: 'kids', is_active: true },
    { name: 'Shoes', handle: 'shoes', is_active: true },
    { name: 'Accessories', handle: 'accessories', is_active: true },
    { name: 'Bags', handle: 'bags', is_active: true },
    { name: 'Activewear', handle: 'activewear', is_active: true },
    { name: 'Outerwear', handle: 'outerwear', is_active: true },
    { name: 'Underwear', handle: 'underwear', is_active: true },
    { name: 'Beauty', handle: 'beauty', is_active: true },
  ];

  const existingCategories = await productModuleService.listProductCategories({}, { take: 500 });
  const existingCategoryByHandle = new Map(
    existingCategories
      .map((category) => [category.handle?.toLowerCase(), category.id] as const)
      .filter(([handle, id]) => !!handle && !!id),
  );
  const existingCategoryByName = new Map(
    existingCategories
      .map((category) => [category.name?.toLowerCase(), category.id] as const)
      .filter(([name, id]) => !!name && !!id),
  );

  let categoryResult: Array<{ id: string; name: string }> = [];
  try {
    categoryResult = (await productModuleService.upsertProductCategories(
      desiredCategories.map((category) => {
        const existingId =
          existingCategoryByHandle.get(category.handle.toLowerCase()) ??
          existingCategoryByName.get(category.name.toLowerCase());
        return existingId ? { ...category, id: existingId } : category;
      }),
    )) as Array<{ id: string; name: string }>;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error ?? '');
    if (!errorMessage.includes('Product category with handle')) {
      throw error;
    }
    // Re-seed safety: if category handles already exist in conflicting rows, reuse existing categories.
    const fallbackCategories = await productModuleService.listProductCategories({}, { take: 500 });
    categoryResult = fallbackCategories
      .map((category) => ({ id: category.id, name: category.name }))
      .filter((category) => !!category.id && !!category.name)
      .filter((category) => desiredCategories.some((desired) => desired.name.toLowerCase() === category.name.toLowerCase()));
  }

  const desiredProductTags = [
    { value: 'New' },
    { value: 'Trending' },
    { value: 'Best Seller' },
    { value: 'Sustainable' },
    { value: 'Essentials' },
  ];

  const existingTags = await productModuleService.listProductTags({}, { take: 500 });
  const existingTagByValue = new Map(
    existingTags
      .filter((tag): tag is { id: string; value: string } => !!tag?.id && !!tag?.value)
      .map((tag) => [tag.value.toLowerCase(), tag.id]),
  );

  const productTagsResult = await productModuleService.upsertProductTags(
    desiredProductTags.map((tag) => {
      const existingId = existingTagByValue.get(tag.value.toLowerCase());
      return existingId ? { ...tag, id: existingId } : tag;
    }),
  );
  const sellerService = container.resolve(SELLER_MODULE) as {
    listSellers: (filters: Record<string, unknown>, config: { take: number }) => Promise<Array<{ id: string; handle: string }>>;
    createSellers: (data: Array<Record<string, unknown>>) => Promise<Array<{ id: string; handle: string }>>;
  };
  const desiredSellers = [
    {
      name: "Urban Thread",
      handle: "urban-thread",
      rating: 4.7,
      review_count: 128,
      city: "New York",
      state: "NY",
      zip: "10001",
      country_code: "US",
      logo_url: "/fiona.webp",
      banner_url: null,
    },
    {
      name: "Pacific Studio",
      handle: "pacific-studio",
      rating: 4.6,
      review_count: 92,
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country_code: "US",
      logo_url: "/fiona.webp",
      banner_url: null,
    },
    {
      name: "Lakefront Supply",
      handle: "lakefront-supply",
      rating: 4.5,
      review_count: 64,
      city: "Chicago",
      state: "IL",
      zip: "60601",
      country_code: "US",
      logo_url: "/fiona.webp",
      banner_url: null,
    },
    {
      name: "Desert Day",
      handle: "desert-day",
      rating: 4.4,
      review_count: 51,
      city: "Austin",
      state: "TX",
      zip: "73301",
      country_code: "US",
      logo_url: "/fiona.webp",
      banner_url: null,
    },
    {
      name: "Coastal Goods",
      handle: "coastal-goods",
      rating: 4.6,
      review_count: 73,
      city: "Miami",
      state: "FL",
      zip: "33101",
      country_code: "US",
      logo_url: "/fiona.webp",
      banner_url: null,
    },
    {
      name: "Canyon Supply",
      handle: "canyon-supply",
      rating: 4.5,
      review_count: 58,
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      country_code: "US",
      logo_url: "/fiona.webp",
      banner_url: null,
    },
    {
      name: "Northline",
      handle: "northline",
      rating: 4.7,
      review_count: 80,
      city: "Seattle",
      state: "WA",
      zip: "98101",
      country_code: "US",
      logo_url: "/fiona.webp",
      banner_url: null,
    },
    {
      name: "Peachtree Select",
      handle: "peachtree-select",
      rating: 4.4,
      review_count: 46,
      city: "Atlanta",
      state: "GA",
      zip: "30301",
      country_code: "US",
      logo_url: "/fiona.webp",
      banner_url: null,
    },
  ];

  const existingSellers = await sellerService.listSellers({}, { take: 500 });
  const existingSellerHandles = new Set(existingSellers.map((seller) => seller.handle));
  const missingSellers = desiredSellers.filter((seller) => !existingSellerHandles.has(seller.handle));

  if (missingSellers.length) {
    await sellerService.createSellers(missingSellers);
  }

  const sellers = await sellerService.listSellers({}, { take: 500 });

  const preparedProducts = seedProducts({
    collections: collectionsResult,
    tags: productTagsResult,
    categories: categoryResult,
    sales_channels: [{ id: defaultSalesChannel[0].id }],
    shipping_profile_id: shippingProfile.id,
  });

  const existingProducts = await productModuleService.listProducts({}, { take: 2000 });
  const existingProductHandles = new Set(
    existingProducts
      .map((product: any) => product?.handle as string | undefined)
      .filter((handle: string | undefined): handle is string => !!handle),
  );
  const productsToCreate = preparedProducts.filter((product: any) => !existingProductHandles.has(product.handle));

  let productResult: any[] = [];
  if (productsToCreate.length) {
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: productsToCreate,
      },
    });
    productResult = result;
  }
  const sellerIdByHandle = new Map(sellers.map((seller: { handle: string; id: string }) => [seller.handle, seller.id]));

  if (productResult.length) {
    await remoteLink.create(
      productResult.map((product: any) => {
        const desiredHandle = SELLER_HANDLE_BY_TITLE[product.title];
        const sellerId = desiredHandle ? sellerIdByHandle.get(desiredHandle) : undefined;
        if (!sellerId) {
          throw new Error(`No seller mapping found for product "${product.title}"`);
        }
        return {
          [Modules.PRODUCT]: { product_id: product.id },
          seller: { seller_id: sellerId },
        };
      }),
    );
  }

  logger.info('Finished seeding product data.');
  logger.info(`PUBLISHABLE API KEY: ${publishableApiKey.token}`);
}







