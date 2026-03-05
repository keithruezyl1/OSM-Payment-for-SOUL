import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, remoteQueryObjectFromString } from "@medusajs/framework/utils";

const FIELDS = [
  "id",
  "title",
  "handle",
  "*seller",
  "seller.*",
  "variants.*",
  "variants.price_set.prices",
];

const normalizeSeller = (product: any) => {
  if (product?.seller) return Array.isArray(product.seller) ? product.seller[0] : product.seller;
  if (product?.sellers) return Array.isArray(product.sellers) ? product.sellers[0] : product.sellers;
  return null;
};

const getMinPriceForCurrency = (product: any, currencyCode: string) => {
  const amounts = (product.variants || [])
    .flatMap((variant: any) => variant?.price_set?.prices ?? [])
    .filter((price: any) => price?.currency_code === currencyCode)
    .map((price: any) => price?.amount)
    .filter((amount: any) => typeof amount === "number");

  if (!amounts.length) return null;
  return Math.min(...amounts);
};

export default async function listProductsWithSellers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  const allRows: Array<{
    product_id: string;
    title: string;
    handle: string;
    price_usd: number | null;
    price_php: number | null;
    seller_id: string | null;
    seller_name: string | null;
    seller_handle: string | null;
  }> = [];

  const limit = 200;
  let offset = 0;

  while (true) {
    const queryObject = remoteQueryObjectFromString({
      entryPoint: "product",
      variables: {
        filters: {},
        limit,
        offset,
      },
      fields: FIELDS,
    });

    const { rows } = await remoteQuery(queryObject);
    if (!rows?.length) break;

    for (const product of rows as any[]) {
      const seller = normalizeSeller(product);
      const priceUsd = getMinPriceForCurrency(product, "usd");
      const pricePhp = getMinPriceForCurrency(product, "php");
      allRows.push({
        product_id: product.id,
        title: product.title,
        handle: product.handle,
        price_usd: priceUsd,
        price_php: pricePhp,
        seller_id: seller?.id ?? null,
        seller_name: seller?.name ?? null,
        seller_handle: seller?.handle ?? null,
      });
    }

    offset += rows.length;
    if (rows.length < limit) break;
  }

  console.log(JSON.stringify({ count: allRows.length, items: allRows }, null, 2));
  logger.info(`Listed ${allRows.length} products with sellers.`);
}
