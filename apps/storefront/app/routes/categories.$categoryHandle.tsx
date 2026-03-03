import { Container } from '@app/components/common/container';
import { ProductListWithPagination } from '@app/components/product/ProductListWithPagination';
import { PageHeading } from '@app/components/sections/PageHeading';
import { listCategories } from '@libs/util/server/data/categories.server';
import { fetchProducts } from '@libs/util/server/products.server';
import clsx from 'clsx';
import { LoaderFunctionArgs, redirect } from 'react-router';
import { NavLink, useLoaderData } from 'react-router';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const handle = params.categoryHandle as string;

  const categories = await listCategories();

  const category = categories.find((c) => c.handle === handle);

  if (!category) {
    throw redirect('/products');
  }

  const { products, count, limit, offset } = await fetchProducts(request, {
    category_id: category.id,
  });

  return {
    products,
    count,
    limit,
    offset,
    category,
    categories,
  };
};

export type ProductCategoryRouteLoader = typeof loader;

export default function ProductCategoryRoute() {
  const data = useLoaderData<ProductCategoryRouteLoader>();

  if (!data) return null;

  const { products, count, limit, offset, categories } = data;

  return (
    <Container className="pb-16">
      <PageHeading className="w-full text-center text-4xl md:text-6xl mt-16 font-semibold tracking-tight">
        {data.category.name}
      </PageHeading>

      {categories.length > 1 && (
        <div className="flex flex-col w-full items-center">
          <div className="flex-1">
            <div className="mt-4 mb-8 inline-flex gap-2 border-b border-slate-200 pb-2 text-sm">
              {categories.map((category) => (
                <NavLink
                  to={`/categories/${category.handle}`}
                  key={category.id}
                  prefetch="viewport"
                  className={({ isActive }) =>
                    clsx('h-full rounded-md px-3 py-2', {
                      'bg-slate-900 text-white': isActive,
                      'text-slate-700 hover:bg-slate-100': !isActive,
                    })
                  }
                >
                  {category.name}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <ProductListWithPagination
            products={products}
            paginationConfig={{ count, offset, limit }}
            context="products"
          />
        </div>
      </div>
    </Container>
  );
}
