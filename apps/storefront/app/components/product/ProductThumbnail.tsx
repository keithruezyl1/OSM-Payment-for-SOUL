import { Image } from '@app/components/common/images/Image';
import type { MarketplaceProduct } from '@libs/types';
import clsx from 'clsx';
import type { FC } from 'react';

export interface ProductThumbnailProps {
  product: MarketplaceProduct;
  isTransitioning?: boolean;
}

export const ProductThumbnail: FC<ProductThumbnailProps> = ({ product, isTransitioning }) => {
  return (
    <Image
      className={clsx('h-full w-full object-cover transition duration-300', {
        'opacity-70': isTransitioning,
      })}
      src={product.thumbnail || product.images?.[0]?.url}
      alt={product.title}
      height={600}
      width={400}
    />
  );
};
