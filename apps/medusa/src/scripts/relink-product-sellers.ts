import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { IProductModuleService } from "@medusajs/framework/types";
import { Client } from "pg";
import { SELLER_MODULE } from "../modules/seller";
import { SELLER_HANDLE_BY_TITLE } from "./seed/products";

export default async function relinkProductSellers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);
  const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
  const sellerService = container.resolve(SELLER_MODULE) as {
    listSellers: (filters: Record<string, unknown>, config: { take: number }) => Promise<Array<{ id: string; handle: string }>>;
  };

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("delete from seller_product");
  } finally {
    await client.end();
  }

  const sellers = await sellerService.listSellers({}, { take: 200 });
  const sellerIdByHandle = new Map(sellers.map((seller) => [seller.handle, seller.id]));

  const products = await productModuleService.listProducts({}, { select: ["id", "title"] });

  const links = products.map((product: any) => {
    const desiredHandle = SELLER_HANDLE_BY_TITLE[product.title];
    const sellerId = desiredHandle ? sellerIdByHandle.get(desiredHandle) : undefined;
    if (!sellerId) {
      throw new Error(`No seller mapping found for product "${product.title}"`);
    }
    return {
      [Modules.PRODUCT]: { product_id: product.id },
      seller: { seller_id: sellerId },
    };
  });

  await remoteLink.create(links);
  logger.info(`Relinked ${links.length} products to sellers.`);
}
