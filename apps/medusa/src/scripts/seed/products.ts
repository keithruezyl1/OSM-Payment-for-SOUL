import type { CreateProductWorkflowInputDTO, ProductCollectionDTO, ProductTagDTO } from "@medusajs/framework/types";
import { ProductStatus } from "@medusajs/utils";

const SIZES = ["XS", "S", "M", "L", "XL"];
const COLORS = ["Black", "White", "Navy", "Red", "Beige"];
const SHARED_PRODUCT_IMAGE_URL = "/pic.jpg";

const FX_RATE_USD_TO_PHP = 58;

const USD_PRICE_BY_TITLE: Record<string, number> = {
  "Slim Chino Pants": 21.99,
  "Everyday Oxford": 16.99,
  "Structured Overshirt": 23.99,
  "Crewneck Sweater": 19.99,
  "Pleated Midi Skirt": 18.99,
  "High-Rise Trousers": 20.99,
  "Ribbed Knit Tee": 10.99,
  "Utility Jacket": 32.99,
  "Relaxed Cardigan": 21.99,
  "Soft Hoodie Set": 14.99,
  "Flowy Wrap Dress": 22.99,
  "Silk Blend Blouse": 25.99,
  "Classic Polo": 14.99,
  "Mini Satchel": 28.99,
  "Everyday Denim": 12.99,
  "Weekender Bag": 39.99,
  "Layered Necklace": 9.99,
  "Breathable Tank": 9.99,
  "Slip-On Sandals": 16.99,
  "Crossbody Sling": 23.99,
  "Everyday Tote": 19.99,
  "Puffer Vest": 13.99,
  "Playday Joggers": 10.99,
  "Metal Cuff": 7.99,
  "Convertible Backpack": 34.99,
  "Woven Scarf": 11.99,
  "Minimal Sneakers": 30.99,
  "Training Shorts": 12.99,
  "Quilted Shoulder": 30.99,
  "Zip Track Jacket": 23.99,
  "Weekend Dress": 11.99,
  "Structured Belt": 10.99,
  "City Loafers": 32.99,
  "Classic Watch Band": 7.99,
  "Graphic Tee Pack": 9.99,
  "Performance Leggings": 19.99,
  "Classic Ankle Boots": 37.99,
  "Everyday Flats": 21.99,
  "Statement Earrings": 6.99,
  "Trail Runners": 39.99,
  "Seamless Briefs": 5.99,
  "Studio Sports Bra": 14.99,
  "Refresh Mist": 7.99,
  "Cotton Boxer Pack": 7.99,
  "Waterproof Shell": 52.99,
  "Wool Blend Coat": 61.99,
  "Cropped Bomber": 41.99,
  "Glow Moisturizer": 12.99,
  "Daily SPF": 9.99,
  "Comfort Bralette": 9.99,
  "Hydration Serum": 14.99,
  "Mesh Triangle": 6.99,
  "Lightweight Hoodie": 23.99,
  "Tinted Balm": 4.99,
  "Nourish Mask": 10.99,
  "Denim Jacket": 34.99,
  "Lounge Shorts": 7.99,
  "Insulated Parka": 66.99,
  "Smoothing Bodysuit": 12.99,
  "Quilted Liner": 37.99,
};

export const SELLER_HANDLE_BY_TITLE: Record<string, string> = {
  "Slim Chino Pants": "urban-thread",
  "Everyday Oxford": "peachtree-select",
  "Structured Overshirt": "northline",
  "Crewneck Sweater": "pacific-studio",
  "Pleated Midi Skirt": "lakefront-supply",
  "High-Rise Trousers": "coastal-goods",
  "Ribbed Knit Tee": "pacific-studio",
  "Utility Jacket": "lakefront-supply",
  "Relaxed Cardigan": "canyon-supply",
  "Soft Hoodie Set": "coastal-goods",
  "Flowy Wrap Dress": "urban-thread",
  "Silk Blend Blouse": "desert-day",
  "Classic Polo": "desert-day",
  "Mini Satchel": "urban-thread",
  "Everyday Denim": "peachtree-select",
  "Weekender Bag": "pacific-studio",
  "Layered Necklace": "lakefront-supply",
  "Breathable Tank": "northline",
  "Slip-On Sandals": "northline",
  "Crossbody Sling": "peachtree-select",
  "Everyday Tote": "northline",
  "Puffer Vest": "urban-thread",
  "Playday Joggers": "canyon-supply",
  "Metal Cuff": "canyon-supply",
  "Convertible Backpack": "desert-day",
  "Woven Scarf": "coastal-goods",
  "Minimal Sneakers": "lakefront-supply",
  "Training Shorts": "canyon-supply",
  "Quilted Shoulder": "lakefront-supply",
  "Zip Track Jacket": "peachtree-select",
  "Weekend Dress": "pacific-studio",
  "Structured Belt": "urban-thread",
  "City Loafers": "desert-day",
  "Classic Watch Band": "desert-day",
  "Graphic Tee Pack": "northline",
  "Performance Leggings": "coastal-goods",
  "Classic Ankle Boots": "canyon-supply",
  "Everyday Flats": "peachtree-select",
  "Statement Earrings": "pacific-studio",
  "Trail Runners": "coastal-goods",
  "Seamless Briefs": "urban-thread",
  "Studio Sports Bra": "urban-thread",
  "Refresh Mist": "desert-day",
  "Cotton Boxer Pack": "lakefront-supply",
  "Waterproof Shell": "canyon-supply",
  "Wool Blend Coat": "lakefront-supply",
  "Cropped Bomber": "desert-day",
  "Glow Moisturizer": "peachtree-select",
  "Daily SPF": "urban-thread",
  "Comfort Bralette": "pacific-studio",
  "Hydration Serum": "northline",
  "Mesh Triangle": "desert-day",
  "Lightweight Hoodie": "pacific-studio",
  "Tinted Balm": "pacific-studio",
  "Nourish Mask": "lakefront-supply",
  "Denim Jacket": "peachtree-select",
  "Lounge Shorts": "canyon-supply",
  "Insulated Parka": "coastal-goods",
  "Smoothing Bodysuit": "coastal-goods",
  "Quilted Liner": "northline",
};

const buildVariants = (skuBase: string, prices: { usd: number; php: number }) => {
  const variants = [] as any[];

  for (const size of SIZES) {
    for (const color of COLORS) {
      variants.push({
        title: `${size} / ${color}`,
        sku: `${skuBase}-${size}-${color}`.toUpperCase().replace(/\s+/g, "-"),
        options: {
          Size: size,
          Color: color,
        },
        manage_inventory: false,
        prices: [
          { amount: prices.php, currency_code: "php" },
          { amount: prices.usd, currency_code: "usd" },
        ],
      });
    }
  }

  return variants;
};

const buildBaseProductData = ({
  sales_channels,
  sku,
  prices,
}: {
  sales_channels: { id: string }[];
  sku: string;
  prices: { usd: number; php: number };
}) => ({
  options: [
    { title: "Size", values: SIZES },
    { title: "Color", values: COLORS },
  ],
  sales_channels: sales_channels.map(({ id }) => ({ id })),
  variants: buildVariants(sku, prices),
});

const productCatalog = [
  {
    category: "Women",
    collection: "New Arrivals",
    basePrice: 35,
    products: [
      "Flowy Wrap Dress",
      "Ribbed Knit Tee",
      "Pleated Midi Skirt",
      "Silk Blend Blouse",
      "High-Rise Trousers",
      "Relaxed Cardigan",
    ],
  },
  {
    category: "Men",
    collection: "Best Sellers",
    basePrice: 42,
    products: [
      "Structured Overshirt",
      "Everyday Oxford",
      "Slim Chino Pants",
      "Crewneck Sweater",
      "Utility Jacket",
      "Classic Polo",
    ],
  },
  {
    category: "Kids",
    collection: "Trending",
    basePrice: 22,
    products: [
      "Soft Hoodie Set",
      "Playday Joggers",
      "Graphic Tee Pack",
      "Everyday Denim",
      "Puffer Vest",
      "Weekend Dress",
    ],
  },
  {
    category: "Shoes",
    collection: "Best Sellers",
    basePrice: 55,
    products: [
      "Minimal Sneakers",
      "City Loafers",
      "Trail Runners",
      "Classic Ankle Boots",
      "Slip-On Sandals",
      "Everyday Flats",
    ],
  },
  {
    category: "Accessories",
    collection: "New Arrivals",
    basePrice: 18,
    products: [
      "Structured Belt",
      "Statement Earrings",
      "Layered Necklace",
      "Classic Watch Band",
      "Woven Scarf",
      "Metal Cuff",
    ],
  },
  {
    category: "Bags",
    collection: "Trending",
    basePrice: 48,
    products: [
      "Everyday Tote",
      "Crossbody Sling",
      "Mini Satchel",
      "Weekender Bag",
      "Quilted Shoulder",
      "Convertible Backpack",
    ],
  },
  {
    category: "Activewear",
    collection: "Best Sellers",
    basePrice: 30,
    products: [
      "Performance Leggings",
      "Training Shorts",
      "Breathable Tank",
      "Zip Track Jacket",
      "Studio Sports Bra",
      "Lightweight Hoodie",
    ],
  },
  {
    category: "Outerwear",
    collection: "Seasonal",
    basePrice: 70,
    products: [
      "Wool Blend Coat",
      "Cropped Bomber",
      "Insulated Parka",
      "Waterproof Shell",
      "Quilted Liner",
      "Denim Jacket",
    ],
  },
  {
    category: "Underwear",
    collection: "Essentials",
    basePrice: 16,
    products: [
      "Seamless Briefs",
      "Comfort Bralette",
      "Cotton Boxer Pack",
      "Mesh Triangle",
      "Smoothing Bodysuit",
      "Lounge Shorts",
    ],
  },
  {
    category: "Beauty",
    collection: "New Arrivals",
    basePrice: 20,
    products: [
      "Hydration Serum",
      "Glow Moisturizer",
      "Daily SPF",
      "Tinted Balm",
      "Nourish Mask",
      "Refresh Mist",
    ],
  },
];

const categoryDescriptions: Record<string, string> = {
  Women: "Modern silhouettes and versatile pieces designed for weekday-to-weekend wear.",
  Men: "Reliable wardrobe staples with tailored fits and everyday comfort.",
  Kids: "Durable and comfortable essentials made for active days and easy styling.",
  Shoes: "City-ready footwear with practical comfort, grip, and all-day support.",
  Accessories: "Polished finishing pieces that add personality without overcomplicating your look.",
  Bags: "Functional carry options built for daily use, work, and weekend travel.",
  Activewear: "Breathable performance basics that balance movement, comfort, and style.",
  Outerwear: "Layer-ready outer pieces built for changing weather and clean structure.",
  Underwear: "Soft foundational essentials focused on fit, stretch, and comfort.",
  Beauty: "Daily-care favorites with lightweight textures and dependable results.",
};

export function getBasePriceForTitle(title: string): { usd: number; php: number } {
  const usd = USD_PRICE_BY_TITLE[title];
  if (typeof usd === "number") {
    const usdMinor = Math.round(usd * 100);
    return { usd: usdMinor, php: usdMinor * FX_RATE_USD_TO_PHP };
  }
  const fallbackUsdMinor = 3500;
  return { usd: fallbackUsdMinor, php: fallbackUsdMinor * FX_RATE_USD_TO_PHP };
}

const tagForIndex = (tags: ProductTagDTO[], index: number) => {
  const tagPool = ["New", "Trending", "Best Seller", "Sustainable", "Essentials"];
  const tagValue = tagPool[index % tagPool.length];
  return tags.filter((tag) => tag.value === tagValue).map((tag) => tag.id);
};

export const seedProducts = ({
  collections,
  tags,
  sales_channels,
  categories,
  shipping_profile_id,
}: {
  collections: ProductCollectionDTO[];
  tags: ProductTagDTO[];
  categories: { id: string; name: string }[];
  sales_channels: { id: string }[];
  shipping_profile_id: string;
}): CreateProductWorkflowInputDTO[] => {
  const products: CreateProductWorkflowInputDTO[] = [];
  let index = 0;

  for (const group of productCatalog) {
    for (const title of group.products) {
      index += 1;
      const sku = `${group.category}-${index}`.toUpperCase().replace(/\s+/g, "-");
      const handle = `${group.category}-${title}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      products.push({
        title,
        description: `${title} - ${categoryDescriptions[group.category]}`,
        handle,
        status: ProductStatus.PUBLISHED,
        category_ids: categories.filter(({ name }) => name === group.category).map(({ id }) => id),
        tag_ids: tagForIndex(tags, index),
        thumbnail: SHARED_PRODUCT_IMAGE_URL,
        collection_id: collections.find(({ title }) => title === group.collection)?.id,
        shipping_profile_id,
        images: [{ url: SHARED_PRODUCT_IMAGE_URL }],
        ...buildBaseProductData({
          sales_channels,
          sku,
          prices: getBasePriceForTitle(title),
        }),
      });
    }
  }

  return products;
};
