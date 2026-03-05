import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { Client } from "pg";

export default async function verifySellerLinks({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows: totalsRows } = await client.query(
      `
      select
        (select count(*) from product where deleted_at is null)::int as total_products,
        (select count(*) from seller where deleted_at is null)::int as total_sellers,
        (select count(*) from seller_product where deleted_at is null)::int as seller_product_rows,
        (select count(distinct product_id) from seller_product where deleted_at is null)::int as linked_products
      `
    );

    const totals = totalsRows[0] ?? {
      total_products: 0,
      total_sellers: 0,
      seller_product_rows: 0,
      linked_products: 0,
    };

    const { rows: missingCountRows } = await client.query(
      `
      select count(*)::int as missing_count
      from product p
      where p.deleted_at is null
        and not exists (
          select 1
          from seller_product sp
          where sp.product_id = p.id
            and sp.deleted_at is null
        )
      `
    );

    const missingCount = Number(missingCountRows[0]?.missing_count ?? 0);

    const { rows: missingProducts } = await client.query(
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

    const payload = {
      total_products: Number(totals.total_products ?? 0),
      total_sellers: Number(totals.total_sellers ?? 0),
      seller_product_rows: Number(totals.seller_product_rows ?? 0),
      linked_products: Number(totals.linked_products ?? 0),
      missing_count: missingCount,
      missing_products_sample: missingProducts,
    };

    console.log(JSON.stringify(payload, null, 2));

    if (missingCount > 0) {
      throw new Error(`Found ${missingCount} products without seller links.`);
    }

    logger.info("Seller link verification passed.");
  } finally {
    await client.end();
  }
}
