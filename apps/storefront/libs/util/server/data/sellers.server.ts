import cachified from '@epic-web/cachified';
import { sdk, sdkCache } from '@libs/util/server/client.server';
import { MILLIS } from '../cache-builder.server';
import type { SellerSummary } from '@libs/types';

export const fetchSellers = async (
  offset: number = 0,
  limit: number = 50,
): Promise<{ sellers: SellerSummary[]; count: number; offset: number; limit: number }> => {
  return cachified({
    key: `sellers-${JSON.stringify({ offset, limit })}`,
    cache: sdkCache,
    staleWhileRevalidate: MILLIS.ONE_HOUR,
    ttl: MILLIS.TEN_SECONDS,
    async getFreshValue() {
      return sdk.client.fetch('/store/sellers', { query: { offset, limit } });
    },
  });
};

export const fetchSellerByHandle = async (handle: string): Promise<SellerSummary> => {
  const response = (await sdk.client.fetch(`/store/sellers/${handle}`)) as { seller: SellerSummary };
  return response.seller as SellerSummary;
};
