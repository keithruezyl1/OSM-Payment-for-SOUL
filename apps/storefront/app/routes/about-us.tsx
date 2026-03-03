import { Container } from '@app/components/common/container';
import Hero from '@app/components/sections/Hero';
import { getMergedPageMeta } from '@libs/util/page';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

export const loader = async (_args: LoaderFunctionArgs) => {
  return {};
};

export const meta: MetaFunction<typeof loader> = getMergedPageMeta;

export default function AboutUsRoute() {
  return (
    <>
      <Container className="!px-0 py-0 sm:!p-16">
        <Hero
          className="min-h-[360px] !max-w-full bg-gradient-to-br from-slate-100 via-white to-slate-50 sm:rounded-3xl p-6 sm:p-10 md:p-[88px] md:px-[88px]"
          backgroundClassName="!bg-none"
          content={
            <div className="text-center w-full space-y-6 text-slate-900">
              <h4 className="text-lg md:text-2xl tracking-wider">ABOUT</h4>
              <h1 className="text-4xl md:text-7xl tracking-tight font-bold">
                Built for real-world shopping
              </h1>
              <p className="mx-auto text-md md:text-xl !leading-normal text-slate-600">
                MarketHaus is a marketplace that pairs independent sellers with customers looking for dependable,
                everyday apparel. Each listing includes seller details and transparent delivery estimates to keep
                shopping clear and confident.
              </p>
            </div>
          }
        />
      </Container>

      <Container className="pt-4 flex flex-col gap-10 py-0 sm:!px-16 pb-24">
        <div className="text-3xl md:text-5xl font-semibold tracking-tight">
          What you can expect
        </div>
        <ul className="grid gap-6 md:grid-cols-3 text-sm text-gray-700">
          <li className="rounded-2xl bg-accent-50 p-6">
            <h3 className="font-bold">Seller transparency</h3>
            <p className="mt-2">Every product is tied to a seller profile with location and rating.</p>
          </li>
          <li className="rounded-2xl bg-accent-50 p-6">
            <h3 className="font-bold">Clear delivery ETA</h3>
            <p className="mt-2">Estimated arrival dates are calculated from seller to customer distance.</p>
          </li>
          <li className="rounded-2xl bg-accent-50 p-6">
            <h3 className="font-bold">Curated inventory</h3>
            <p className="mt-2">Focused categories keep browsing fast and relevant.</p>
          </li>
        </ul>
      </Container>
    </>
  );
}
