import { useRegion } from '@app/hooks/useRegion';
import type { MarketplaceProduct } from '@libs/types';
import clsx from 'clsx';
import type { FC, HTMLAttributes } from 'react';
import { ProductBadges } from './ProductBadges';
import { ProductPrice } from './ProductPrice';
import { ProductThumbnail } from './ProductThumbnail';

export interface ProductListItemProps extends HTMLAttributes<HTMLElement> {
  product: MarketplaceProduct;
  isTransitioning?: boolean;
}

export const ProductListItem: FC<ProductListItemProps> = ({ product, className, isTransitioning, ...props }) => {
  const { region } = useRegion();
  const seller = product.seller;

  return (
    <article className={clsx(className, 'group/product-card rounded-xl border border-slate-200 bg-white p-3 text-left')} {...props}>
      <div className="relative overflow-hidden rounded-lg">
        <ProductBadges className="absolute right-2 top-2 z-10 flex gap-2" product={product} />
        <ProductThumbnail isTransitioning={isTransitioning} product={product} />
      </div>

      <h4 className="mt-3 overflow-hidden text-ellipsis text-sm font-semibold text-slate-900">{product.title}</h4>
      <p className="mt-1 text-base font-medium text-slate-900">
        <ProductPrice product={product} currencyCode={region.currency_code} />
      </p>

      {seller && (
        <p className="mt-2 text-xs text-slate-600">
          Sold by {seller.name}
          {seller.city ? ` • ${seller.city}${seller.state ? `, ${seller.state}` : ''}` : ''}
        </p>
      )}

      {seller && (
        <p className="mt-1 text-xs text-slate-500">
          {typeof product.eta_days === 'number' ? `Est. ${product.eta_days} days` : 'Enter address for ETA'}
        </p>
      )}
    </article>
  );
};
