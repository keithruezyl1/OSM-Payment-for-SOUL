import { Container } from '@app/components/common/container';
import { Image } from '@app/components/common/images/Image';
import { PageHeading } from '@app/components/sections/PageHeading';
import { fetchSellers } from '@libs/util/server/data/sellers.server';
import type { LoaderFunctionArgs } from 'react-router';
import { Link, useLoaderData } from 'react-router';

export const loader = async (_args: LoaderFunctionArgs) => {
  const { sellers, count, limit, offset } = await fetchSellers();
  return { sellers, count, limit, offset };
};

export default function ShopsIndexRoute() {
  const { sellers } = useLoaderData<typeof loader>();

  return (
    <Container className="pb-16">
      <PageHeading className="mt-16 w-full text-center text-4xl font-semibold tracking-tight md:text-6xl">
        Shops
      </PageHeading>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600">
        Browse independent sellers and view their product listings with delivery estimates.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sellers.map((seller) => (
          <Link
            key={seller.id}
            to={`/shops/${seller.handle}`}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-400 hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Image
                src={seller.logo_url || '/fiona.webp'}
                alt={`${seller.name} profile`}
                className="h-12 w-12 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{seller.name}</h3>
                <p className="text-sm text-slate-600">
                  {seller.city}
                  {seller.state ? `, ${seller.state}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">
              Rating {seller.rating ?? 4.5} • {seller.review_count ?? 0} reviews
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
