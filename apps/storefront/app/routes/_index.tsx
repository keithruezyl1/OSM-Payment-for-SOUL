import { ActionList } from '@app/components/common/actions-list/ActionList';
import { Container } from '@app/components/common/container';
import Hero from '@app/components/sections/Hero';
import ProductList from '@app/components/sections/ProductList';
import { getMergedPageMeta } from '@libs/util/page';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

export const loader = async (_args: LoaderFunctionArgs) => {
  return {};
};

export const meta: MetaFunction<typeof loader> = getMergedPageMeta;

export default function IndexRoute() {
  return (
    <>
      <Hero
        className="h-[520px] !max-w-full -mt-[calc(var(--mkt-header-height)+2rem)] md:-mt-[calc(var(--mkt-header-height-desktop)+2rem)] pt-[var(--mkt-header-height)] md:pt-[var(--mkt-header-height-desktop)] bg-gradient-to-b from-slate-100 via-white to-slate-50"
        backgroundClassName="!bg-none"
        content={
          <div className="mx-auto max-w-5xl space-y-6 text-center text-slate-900">
            <h4 className="text-xs uppercase tracking-[0.35em] text-slate-500">MarketHaus</h4>
            <h1 className="text-4xl font-bold tracking-tight md:text-7xl">
              Discover marketplace fashion from independent sellers
            </h1>
            <p className="mx-auto max-w-3xl text-base text-slate-600 md:text-lg">
              Browse apparel, compare trusted shops, and see transparent delivery estimates before checkout.
            </p>
          </div>
        }
        actions={[
          { label: 'Shop All Products', url: '/products' },
          { label: 'Browse Shops', url: '/shops' },
        ]}
        actionsClassName="mx-auto mt-8 w-fit !flex-row"
      />

      <Container className="grid gap-4 px-4 pb-6 pt-4 md:grid-cols-6 md:px-10">
        {[
          'Women',
          'Men',
          'Kids',
          'Shoes',
          'Accessories',
          'Bags',
        ].map((category) => (
          <a
            key={category}
            href={`/products?q=${encodeURIComponent(category)}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            {category}
          </a>
        ))}
      </Container>

      <ProductList
        className="!pb-12"
        heading="Trending now"
        actions={[{ label: 'View all', url: '/products' }]}
      />

      <Container className="pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Verified Sellers</h3>
            <p className="mt-2 text-sm text-slate-700">
              Every product is linked to a seller profile with location and rating details.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Clear ETA</h3>
            <p className="mt-2 text-sm text-slate-700">
              Delivery estimates are calculated from seller-to-customer distance.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ready Checkout</h3>
            <p className="mt-2 text-sm text-slate-700">
              Add to cart and complete checkout with the existing Stripe flow.
            </p>
          </div>
        </div>
        <ActionList actions={[{ label: 'Explore all shops', url: '/shops' }]} className="mt-8 justify-center" />
      </Container>
    </>
  );
}
