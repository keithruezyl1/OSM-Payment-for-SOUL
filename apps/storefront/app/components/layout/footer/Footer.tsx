import { LogoStoreName } from '@app/components/LogoStoreName/LogoStoreName';
import { Container } from '@app/components/common/container/Container';
import { Select } from '@app/components/common/forms/inputs/Select';
import { URLAwareNavLink } from '@app/components/common/link/URLAwareNavLink';
import { useRegion } from '@app/hooks/useRegion';
import { useRegions } from '@app/hooks/useRegions';
import { useSiteDetails } from '@app/hooks/useSiteDetails';
import { convertToFormData } from '@libs/util/forms/objectToFormData';
import { useMemo } from 'react';
import { useFetcher } from 'react-router';

export const Footer = () => {
  const { footerNavigationItems } = useSiteDetails();
  const fetcher = useFetcher();
  const { regions } = useRegions();
  const { region } = useRegion();

  const regionOptions = useMemo(() => {
    return regions.map((item) => ({
      label: `${item.name} (${item.currency_code})`,
      value: item.id,
    }));
  }, [regions]);

  const onRegionChange = (regionId: string) => {
    fetcher.submit(convertToFormData({ regionId }), { method: 'post', action: '/api/region' });
  };

  return (
    <footer className="border-t border-slate-300 bg-white py-10 text-slate-900">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-start">
          <div className="space-y-3">
            <LogoStoreName />
            <p className="max-w-md text-sm leading-6 text-slate-700">
              MarketHaus is a marketplace storefront demo with seller attribution, delivery ETA visibility, and
              checkout-ready product browsing.
            </p>
          </div>

          <div>
            <h5 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Explore</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {footerNavigationItems?.map(({ id, new_tab, ...navItemProps }) => (
                <URLAwareNavLink
                  key={id}
                  {...navItemProps}
                  newTab={new_tab}
                  className="text-slate-700 hover:text-slate-900"
                  prefetch="viewport"
                >
                  {navItemProps.label}
                </URLAwareNavLink>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-700">
            <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Support</h5>
            <p>Email: support@markethaus.example</p>
            <p>Hours: Mon-Fri, 9:00 AM to 6:00 PM</p>
            <p className="text-slate-500">Secure checkout powered by Stripe.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
          <Select
            className="w-full md:w-[320px] !text-base border border-slate-300 bg-white text-slate-900 !shadow-none"
            options={regionOptions}
            defaultValue={region?.id}
            onChange={(e) => onRegionChange(e.target.value)}
          />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} MarketHaus</p>
        </div>
      </Container>
    </footer>
  );
};
