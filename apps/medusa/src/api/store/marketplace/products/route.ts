import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { refetchEntity } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  ProductStatus,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { estimateEtaDays } from "../../../../utils/eta";

const MARKETPLACE_PRODUCT_FIELDS = [
  "*",
  "images.*",
  "options.*",
  "options.values.*",
  "variants.*",
  "variants.options.*",
  "collection.*",
  "categories.*",
  "tags.*",
  "*seller",
  "variants.calculated_price",
];

const parseList = (value: unknown) => {
  if (!value) return [] as string[];
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value !== "string") return [] as string[];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
};

const parseNumber = (value: unknown, fallback: number) => {
  if (!value) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" && typeof raw !== "number") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSeller = (product: any) => {
  if (product?.seller) return Array.isArray(product.seller) ? product.seller[0] : product.seller;
  if (product?.sellers) return Array.isArray(product.sellers) ? product.sellers[0] : product.sellers;
  return null;
};

const matchesVariantOptions = (
  product: any,
  sizeValues: string[],
  colorValues: string[],
) => {
  if (!sizeValues.length && !colorValues.length) return true;

  const optionIdToTitle = new Map<string, string>();
  (product.options || []).forEach((option: any) => {
    if (option?.id && option?.title) {
      optionIdToTitle.set(option.id, option.title.toLowerCase());
    }
  });

  return (product.variants || []).some((variant: any) => {
    const optionValueMap = new Map<string, string>();
    (variant.options || []).forEach((opt: any) => {
      const title = optionIdToTitle.get(opt.option_id)?.toLowerCase();
      if (title) {
        optionValueMap.set(title, String(opt.value));
      }
    });

    const sizeMatch = !sizeValues.length || sizeValues.includes(optionValueMap.get("size") || "");
    const colorMatch = !colorValues.length || colorValues.includes(optionValueMap.get("color") || "");

    return sizeMatch && colorMatch;
  });
};

const getMinVariantPrice = (product: any) => {
  const prices = (product.variants || []).map((variant: any) => {
    const calc = variant?.calculated_price?.calculated_amount;
    const original = variant?.calculated_price?.original_amount;
    return typeof calc === "number" ? calc : typeof original === "number" ? original : 0;
  });
  return prices.length ? Math.min(...prices) : 0;
};

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const regionId = typeof req.query.region_id === "string" ? req.query.region_id : undefined;
  const customerZip = typeof req.query.customer_zip === "string" ? req.query.customer_zip : undefined;

  const limit = parseNumber(req.query.limit, 50);
  const offset = parseNumber(req.query.offset, 0);
  const orderParam = typeof req.query.order === "string" ? req.query.order : undefined;

  const filters: Record<string, unknown> = {
    status: ProductStatus.PUBLISHED,
  };

  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  if (q) filters.q = q;

  const handle = typeof req.query.handle === "string" ? req.query.handle : undefined;
  if (handle) filters.handle = handle;

  const categoryIds = parseList(req.query.category_id as string | string[] | undefined);
  if (categoryIds.length) {
    filters.categories = { id: categoryIds };
  }

  const collectionIds = parseList(req.query.collection_id as string | string[] | undefined);
  if (collectionIds.length) {
    filters.collection_id = collectionIds;
  }

  const tagIds = parseList(req.query.tag_id as string | string[] | undefined);
  if (tagIds.length) {
    filters.tags = { id: tagIds };
  }

  const sizeValues = parseList(req.query.size as string | string[] | undefined).map((v) => v.trim());
  const colorValues = parseList(req.query.color as string | string[] | undefined).map((v) => v.trim());

  const sellerId = typeof req.query.seller_id === "string" ? req.query.seller_id : undefined;
  const sellerHandle = typeof req.query.seller_handle === "string" ? req.query.seller_handle : undefined;

  const priceMin = req.query.price_min ? Number(req.query.price_min) : undefined;
  const priceMax = req.query.price_max ? Number(req.query.price_max) : undefined;

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  let pricingContext: { region_id: string; currency_code: string } | undefined;
  if (regionId) {
    const region = await refetchEntity("region", regionId, req.scope, ["id", "currency_code"]);
    if (region) {
      pricingContext = { region_id: region.id, currency_code: region.currency_code };
    }
  }

  const fields = Array.from(new Set(MARKETPLACE_PRODUCT_FIELDS));

  let order: string | undefined;
  if (orderParam === "newest") order = "-created_at";
  if (orderParam === "price_asc") order = "variants.calculated_price";
  if (orderParam === "price_desc") order = "-variants.calculated_price";

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "product",
    variables: {
      filters,
      limit: 1000,
      offset: 0,
      ...(order ? { order } : {}),
      ...(pricingContext
        ? { "variants.calculated_price": { context: pricingContext } }
        : {}),
    },
    fields,
  });

  const { rows } = await remoteQuery(queryObject);

  let products = rows.map((product: any) => {
    const seller = normalizeSeller(product);
    const eta_days = seller ? estimateEtaDays(seller.zip, customerZip) : null;
    return { ...product, seller, eta_days };
  });

  if (sellerId) {
    products = products.filter((product: any) => product.seller?.id === sellerId);
  }

  if (sellerHandle) {
    products = products.filter((product: any) => product.seller?.handle === sellerHandle);
  }

  if (sizeValues.length || colorValues.length) {
    products = products.filter((product: any) => matchesVariantOptions(product, sizeValues, colorValues));
  }

  if (Number.isFinite(priceMin) || Number.isFinite(priceMax)) {
    products = products.filter((product: any) => {
      const minPrice = getMinVariantPrice(product);
      if (Number.isFinite(priceMin) && minPrice < (priceMin as number)) return false;
      if (Number.isFinite(priceMax) && minPrice > (priceMax as number)) return false;
      return true;
    });
  }

  if (orderParam === "price_asc") {
    products = products.sort((a: any, b: any) => getMinVariantPrice(a) - getMinVariantPrice(b));
  }

  if (orderParam === "price_desc") {
    products = products.sort((a: any, b: any) => getMinVariantPrice(b) - getMinVariantPrice(a));
  }

  if (orderParam === "newest") {
    products = products.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  const count = products.length;
  const paginated = products.slice(offset, offset + limit);

  res.json({ products: paginated, count, offset, limit });
}

