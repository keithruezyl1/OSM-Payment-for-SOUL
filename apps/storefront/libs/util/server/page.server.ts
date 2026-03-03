import type { StoreCollection, StoreProductCategory } from '@medusajs/types';
import { fetchProducts } from './products.server';

export const getProductListData = async (request: Request) => {
  const productsQuery = {
    limit: 10,
    offset: 0,
  };

  const { products } = await fetchProducts(request, productsQuery);
  const collectionTabs = new Map<string, StoreCollection>();
  const categoryTabs = new Map<string, StoreProductCategory>();

  products.forEach((product) => {
    product?.categories?.forEach((category) => {
      categoryTabs.set(category.id, category);
    });

    if (product.collection) {
      collectionTabs.set(product.collection.id, product.collection);
    }
  });

  return {
    products,
    collection_tabs: [...collectionTabs.values()],
    category_tabs: [...categoryTabs.values()],
  };
};
