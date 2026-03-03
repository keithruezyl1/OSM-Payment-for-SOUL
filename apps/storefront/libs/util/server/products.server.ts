import cachified from '@epic-web/cachified';
import type { MarketplaceProduct } from '@libs/types';
import { sdk, sdkCache } from '@libs/util/server/client.server';
import { MILLIS } from './cache-builder.server';
import { getCustomer } from './data/customer.server';
import { retrieveCart } from './data/cart.server';
import { getSelectedRegion } from './data/regions.server';

const getCustomerZip = async (request: Request) => {
  const customer = await getCustomer(request);

  const customerAddress = customer?.default_shipping_address_id
    ? customer.addresses?.find((address) => address.id === customer.default_shipping_address_id)
    : customer?.addresses?.[0];

  if (customerAddress?.postal_code) {
    return customerAddress.postal_code;
  }

  const cart = await retrieveCart(request);
  const cartZip = cart?.shipping_address?.postal_code;

  return cartZip || undefined;
};

export const fetchProducts = async (
  request: Request,
  { ...query }: Record<string, any> = {},
): Promise<{ products: MarketplaceProduct[]; count: number; limit: number; offset: number }> => {
  const region = await getSelectedRegion(request.headers);
  const customerZip = await getCustomerZip(request);

  return await cachified({
    key: `marketplace-products-${JSON.stringify({ query, region: region.id, customerZip })}`,
    cache: sdkCache,
    staleWhileRevalidate: MILLIS.ONE_HOUR,
    ttl: MILLIS.TEN_SECONDS,
    async getFreshValue() {
      return await sdk.client.fetch('/store/marketplace/products', {
        query: {
          ...query,
          region_id: region.id,
          customer_zip: customerZip,
        },
      });
    },
  });
};
