import { createProductReviewResponsesWorkflow } from '@lambdacurry/medusa-product-reviews/workflows/create-product-review-responses';
import { createProductReviewsWorkflow } from '@lambdacurry/medusa-product-reviews/workflows/create-product-reviews';
import {
  createApiKeysWorkflow,
  createOrderWorkflow,
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
import type { IPaymentModuleService } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { createCollectionsWorkflow } from '@medusajs/medusa/core-flows';
import type {
  ExecArgs,
  IFulfillmentModuleService,
  ISalesChannelModuleService,
  IStoreModuleService,
} from '@medusajs/types';
import { SELLER_MODULE } from '../modules/seller';
import { seedProducts, SELLER_HANDLE_BY_TITLE } from './seed/products';
import { generateReviewResponse, reviewContents, texasCustomers } from './seed/reviews';

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);
  const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService: ISalesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService: IStoreModuleService = container.resolve(Modules.STORE);

  const paymentModuleService: IPaymentModuleService = container.resolve(Modules.PAYMENT);

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
  const usRegion = regionResult[0];
  const phRegion = regionResult[1];
  logger.info('Finished seeding regions.');

  logger.info('Seeding tax regions...');

  await createTaxRegionsWorkflow(container).run({
    input: allCountries.map((country_code) => ({
      country_code,
    })),
  });

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

  const shippingProfile = shippingProfileResult[0];

  const northAmericanFulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: 'North American delivery',
    type: 'shipping',
    service_zones: [
      {
        name: 'United States',
        geo_zones: [
          {
            country_code: 'us',
            type: 'country',
          },
        ],
      },
      {
        name: 'Canada',
        geo_zones: [
          {
            country_code: 'ca',
            type: 'country',
          },
        ],
      },
    ],
  });

  await remoteLink.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: americanStockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: northAmericanFulfillmentSet.id,
    },
  });

  const { result: collectionsResult } = await createCollectionsWorkflow(container).run({
    input: {
      collections: [
        {
          title: "New Arrivals",
          handle: "new-arrivals",
        },
        {
          title: "Best Sellers",
          handle: "best-sellers",
        },
        {
          title: "Trending",
          handle: "trending",
        },
        {
          title: "Sale",
          handle: "sale",
        },
        {
          title: "Seasonal",
          handle: "seasonal",
        },
        {
          title: "Essentials",
          handle: "essentials",
        },
      ],
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: 'Standard Shipping',
        price_type: 'flat',
        provider_id: 'manual_manual',
        service_zone_id: northAmericanFulfillmentSet.service_zones[0].id,
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
        service_zone_id: northAmericanFulfillmentSet.service_zones[0].id,
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

    const { result: categoryResult } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Women", is_active: true },
        { name: "Men", is_active: true },
        { name: "Kids", is_active: true },
        { name: "Shoes", is_active: true },
        { name: "Accessories", is_active: true },
        { name: "Bags", is_active: true },
        { name: "Activewear", is_active: true },
        { name: "Outerwear", is_active: true },
        { name: "Underwear", is_active: true },
        { name: "Beauty", is_active: true },
      ],
    },
  });

    const { result: productTagsResult } = await createProductTagsWorkflow(container).run({
    input: {
      product_tags: [
        { value: "New" },
        { value: "Trending" },
        { value: "Best Seller" },
        { value: "Sustainable" },
        { value: "Essentials" },
      ],
    },
  });
  const sellerService = container.resolve(SELLER_MODULE) as {
    createSellers: (data: Array<Record<string, unknown>>) => Promise<Array<{ id: string; handle: string }>>;
  };
  const sellers = await sellerService.createSellers([
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
  ]);

  const { result: productResult } = await createProductsWorkflow(container).run({
    input: {
      products: seedProducts({
        collections: collectionsResult,
        tags: productTagsResult,
        categories: categoryResult,
        sales_channels: [{ id: defaultSalesChannel[0].id }],
        shipping_profile_id: shippingProfile.id,
      }),
    },
  });
  const sellerIdByHandle = new Map(sellers.map((seller: { handle: string; id: string }) => [seller.handle, seller.id]));

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

  for (const product of productResult) {
    const firstVariant = product.variants[0];
    const usdPrice = (((firstVariant as any).prices as any[] | undefined)?.find((price: any) => price.currency_code === 'usd')?.amount ?? 35) as number;

    // Determine a random number of reviews between 5 and 10 for this product
    const numReviews = Math.floor(Math.random() * 6) + 5; // Random number between 5 and 10

    // Shuffle the customers array to get random customers for each product
    const shuffledCustomers = [...texasCustomers].sort(() => 0.5 - Math.random());
    const selectedCustomers = shuffledCustomers.slice(0, numReviews);

    // Shuffle the review contents to get random reviews
    const shuffledReviews = [...reviewContents].sort(() => 0.5 - Math.random());
    const selectedReviews = shuffledReviews.slice(0, numReviews);

    // Create multiple orders for each product with different customers
    const orders = [];
    for (const customer of selectedCustomers) {
      const { result: order } = await createOrderWorkflow(container).run({
        input: {
          email: customer.email,
          shipping_address: {
            first_name: customer.first_name,
            last_name: customer.last_name,
            phone: customer.phone,
            city: customer.city,
            country_code: 'US',
            province: 'TX',
            address_1: customer.address_1,
            postal_code: customer.postal_code,
          },
          items: [
            {
              variant_id: firstVariant.id,
              product_id: product.id,
              quantity: 1,
              title: product.title,
              thumbnail: product.thumbnail ?? undefined,
              unit_price: usdPrice,
            },
          ],
          transactions: [
            {
              amount: usdPrice,
              currency_code: 'usd',
            },
          ],
          region_id: usRegion.id,
          sales_channel_id: defaultSalesChannel[0].id,
        },
      });

      orders.push(order);
    }

    // Create product reviews for each order
    const productReviews = [];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const customer = selectedCustomers[i];
      const review = selectedReviews[i];

      productReviews.push({
        product_id: product.id,
        order_id: order.id,
        order_line_item_id: order.items?.[0]?.id,
        rating: review.rating,
        content: review.content,
        first_name: customer.first_name,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        images: [],
      });
    }

    const { result: productReviewsResult } = await createProductReviewsWorkflow(container).run({
      input: {
        productReviews: productReviews,
      },
    });

    await createProductReviewResponsesWorkflow(container).run({
      input: {
        responses: productReviewsResult.map((review) => ({
          product_review_id: review.id,
          content: generateReviewResponse(review),
        })),
      },
    });
  }

  logger.info('Finished seeding product data.');
  logger.info(`PUBLISHABLE API KEY: ${publishableApiKey.token}`);
}







