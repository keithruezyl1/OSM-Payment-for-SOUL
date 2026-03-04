/**
 * Repair script: Attach prices to product variants that are missing the ProductVariant-PriceSet link.
 *
 * Run this ONLY if `yarn medusa:init` does not fix $0 product prices.
 *
 * Usage: yarn repair-prices (from apps/medusa)
 */

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { upsertVariantPricesWorkflow } from "@medusajs/medusa/core-flows";
import type { IProductModuleService } from "@medusajs/framework/types";
import { getBasePriceForTitle } from "./seed/products";

export default async function repairVariantPrices({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Repairing variant prices: listing products with variants...");

  const products = await productModuleService.listProducts(
    {},
    { relations: ["variants"] }
  );

  const variantPrices: Array<{
    variant_id: string;
    product_id: string;
    prices: Array<{ amount: number; currency_code: string }>;
  }> = [];

  for (const product of products) {
    const { usd, cad } = getBasePriceForTitle(product.title);
    const variants = product.variants ?? [];

    for (const variant of variants) {
      variantPrices.push({
        variant_id: variant.id,
        product_id: product.id,
        prices: [
          { amount: usd, currency_code: "usd" },
          { amount: cad, currency_code: "cad" },
        ],
      });
    }
  }

  if (variantPrices.length === 0) {
    logger.info("No product variants found. Nothing to repair.");
    return;
  }

  logger.info(`Upserting prices for ${variantPrices.length} variant(s)...`);

  await upsertVariantPricesWorkflow(container).run({
    input: {
      variantPrices,
      previousVariantIds: [],
    },
  });

  logger.info("Variant prices repair complete. Restart Medusa and verify with: GET /store/marketplace/products?limit=1&region_id=<region_id>");
}
