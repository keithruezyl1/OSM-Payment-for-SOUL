import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SELLER_MODULE } from "../../../modules/seller";

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const sellerService = req.scope.resolve(SELLER_MODULE);
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const [sellers, count] = await sellerService.listAndCountSellers(
    {},
    { take: limit, skip: offset },
  );

  res.json({ sellers, count, offset, limit });
}
