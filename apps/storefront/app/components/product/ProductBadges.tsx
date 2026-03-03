import { SoldOutBadge } from '@app/components/badges/SoldOutBadge';
import { useProductInventory } from '@app/hooks/useProductInventory';
import type { MarketplaceProduct } from '@libs/types';
import { FC, HTMLAttributes } from 'react';

interface ProductBadgesProps extends HTMLAttributes<HTMLElement> {
  product: MarketplaceProduct;
  className?: string;
}

export const ProductBadges: FC<ProductBadgesProps> = ({ product, className }) => {
  const productInventory = useProductInventory(product);
  const isSoldOut = productInventory.averageInventory === 0;

  return <div className={className}>{isSoldOut && <SoldOutBadge />}</div>;
};
