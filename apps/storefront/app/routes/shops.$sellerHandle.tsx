import { Container } from '@app/components/common/container';
import { ProductListWithPagination } from '@app/components/product/ProductListWithPagination';
import { PageHeading } from '@app/components/sections/PageHeading';
import { fetchSellerByHandle } from '@libs/util/server/data/sellers.server';
import { fetchProducts } from '@libs/util/server/products.server';
import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const sellerHandle = params.sellerHandle as string;
  const seller = await fetchSellerByHandle(sellerHandle);
  const { products, count, limit, offset } = await fetchProducts(request, {
    seller_handle: sellerHandle,
  });

  return { seller, products, count, limit, offset };
};

export default function SellerDetailRoute() {
  const { seller, products, count, limit, offset } = useLoaderData<typeof loader>();

  return (
    <Container className="pb-16">
      <PageHeading className="mt-16 w-full text-center text-4xl font-semibold tracking-tight md:text-6xl">
        {seller.name}
      </PageHeading>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-base text-slate-700">
          {seller.city}
          {seller.state ? `, ${seller.state}` : ''} • Rating {seller.rating ?? 4.5}
        </p>
        <p className="mt-2 text-sm text-slate-500">{seller.review_count ?? 0} verified customer reviews</p>
      </div>

      <div className="mt-10">
        <ProductListWithPagination
          products={products}
          paginationConfig={{ count, offset, limit }}
          context={`seller-${seller.handle}`}
        />
      </div>
    </Container>
  );
}
