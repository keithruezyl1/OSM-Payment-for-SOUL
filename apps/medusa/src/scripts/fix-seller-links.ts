import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { IProductModuleService } from "@medusajs/framework/types";
import { Client } from "pg";
import { ulid } from "ulid";
import { SELLER_MODULE } from "../modules/seller";
import { SELLER_HANDLE_BY_TITLE } from "./seed/products";

export default async function fixSellerLinks({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
  const sellerService = container.resolve(SELLER_MODULE);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sellers = await sellerService.listSellers({}, { take: 200 });
  const sellerIdByHandle = new Map(sellers.map((seller: any) => [seller.handle, seller.id]));

  const products = await productModuleService.listProducts({}, { select: ["id", "title"] });

  const rows = products.map((product: any) => {
    const desiredHandle = SELLER_HANDLE_BY_TITLE[product.title];
    const sellerId = desiredHandle ? sellerIdByHandle.get(desiredHandle) : undefined;
    if (!sellerId) {
      throw new Error(`No seller mapping found for product "${product.title}"`);
    }
    return { id: `selprod_${ulid()}`, product_id: product.id, seller_id: sellerId };
  });

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("delete from seller_product");

    if (rows.length) {
      const values = rows
        .map(
          (row, index) =>
            `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, now(), now())`,
        )
        .join(", ");
      const params = rows.flatMap((row) => [row.id, row.product_id, row.seller_id, null]);
      await client.query(
        `insert into seller_product (id, product_id, seller_id, deleted_at, created_at, updated_at) values ${values}`,
        params
      );
    }

    const { rows: statsRows } = await client.query(
      `
      select
        count(*)::int as row_count,
        count(distinct product_id)::int as distinct_product_count
      from seller_product
      where deleted_at is null
      `
    );

    const { rows: linkedRows } = await client.query(
      `
      select count(*)::int as linked_product_count
      from product p
      where p.deleted_at is null
        and exists (
          select 1
          from seller_product sp
          where sp.product_id = p.id
            and sp.deleted_at is null
        )
      `
    );

    const rowCount = Number(statsRows[0]?.row_count ?? 0);
    const distinctProductCount = Number(statsRows[0]?.distinct_product_count ?? 0);
    const linkedProductCount = Number(linkedRows[0]?.linked_product_count ?? 0);
    const totalProductCount = products.length;

    logger.info(`seller_product rows: ${rowCount}`);
    logger.info(`distinct linked products: ${distinctProductCount}`);
    logger.info(`linked products: ${linkedProductCount} / ${totalProductCount}`);

    if (linkedProductCount !== totalProductCount || distinctProductCount !== totalProductCount) {
      const { rows: missingRows } = await client.query(
        `
        select p.id, p.title
        from product p
        where p.deleted_at is null
          and not exists (
            select 1
            from seller_product sp
            where sp.product_id = p.id
              and sp.deleted_at is null
          )
        order by p.title asc
        limit 10
        `
      );

      throw new Error(
        `Seller link integrity check failed. linked=${linkedProductCount}, distinct=${distinctProductCount}, total=${totalProductCount}, missing_sample=${JSON.stringify(missingRows)}`
      );
    }
  } finally {
    await client.end();
  }

  logger.info(`Relinked ${rows.length} products to sellers.`);
}
