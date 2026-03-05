import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { SELLER_MODULE } from "../../../../modules/seller";

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const handle = req.params.handle as string;
  const sellerService = req.scope.resolve(SELLER_MODULE) as {
    listSellers: (filters: Record<string, unknown>, config: { take: number }) => Promise<any[]>;
  };

  const sellers = await sellerService.listSellers({ handle }, { take: 1 });
  const seller = sellers?.[0];

  if (!seller) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Seller with handle ${handle} not found`,
    );
  }

  res.json({ seller });
}
