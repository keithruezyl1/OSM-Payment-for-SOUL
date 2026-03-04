import type { CreateProductWorkflowInputDTO, ProductCollectionDTO, ProductTagDTO } from "@medusajs/framework/types";
import { ProductStatus } from "@medusajs/utils";

const SIZES = ["XS", "S", "M", "L", "XL"];
const COLORS = ["Black", "White", "Navy", "Red", "Beige"];
const SHARED_PRODUCT_IMAGE_URL = "/pic.jpg";

const buildVariants = (skuBase: string, prices: { usd: number; cad: number }) => {
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
          { amount: prices.cad, currency_code: "cad" },
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
  prices: { usd: number; cad: number };
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

export function getBasePriceForTitle(title: string): { usd: number; cad: number } {
  for (const group of productCatalog) {
    if (group.products.includes(title)) {
      return {
        usd: group.basePrice * 100,
        cad: (group.basePrice + 10) * 100,
      };
    }
  }
  return { usd: 3500, cad: 4500 };
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
          prices: {
            usd: group.basePrice * 100,
            cad: (group.basePrice + 10) * 100,
          },
        }),
      });
    }
  }

  return products;
};
