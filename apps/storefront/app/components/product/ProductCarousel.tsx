import { ScrollArrowButtons } from '@app/components/common/buttons/ScrollArrowButtons';
import { useScrollArrows } from '@app/hooks/useScrollArrows';
import type { MarketplaceProduct } from '@libs/types';
import clsx from 'clsx';
import { type FC, memo } from 'react';
import { NavLink } from 'react-router';
import { ProductCarouselSkeleton } from './ProductCarouselSkeleton';
import type { ProductListItemProps } from './ProductListItem';
import { ProductListItem } from './ProductListItem';

export interface ProductCarouselProps {
  products?: MarketplaceProduct[];
  className?: string;
  renderItem?: FC<ProductListItemProps>;
}

export const ProductRow: FC<{ products: MarketplaceProduct[] }> = memo(({ products }) => {
  return (
    <>
      {products.map((product) => (
        <div
          key={product.id}
          className="xs:w-[47.5%] xs:snap-start mr-6 inline-block w-[100%] snap-center last:mr-0 sm:mr-6 sm:snap-start md:w-[31.2%] xl:mr-8 xl:w-[23%]"
        >
          <NavLink prefetch="viewport" to={`/products/${product.handle}`} viewTransition>
            {({ isTransitioning }) => <ProductListItem isTransitioning={isTransitioning} product={product} />}
          </NavLink>
        </div>
      ))}
    </>
  );
});

export const ProductCarousel: FC<ProductCarouselProps> = ({ products, className }) => {
  const { scrollableDivRef, ...scrollArrowProps } = useScrollArrows({
    buffer: 100,
    resetOnDepChange: [products],
  });

  if (!products) return <ProductCarouselSkeleton length={4} />;

  return (
    <div className={clsx('product-carousel relative', className)}>
      <div
        ref={scrollableDivRef}
        className="w-full snap-both snap-mandatory overflow-x-auto whitespace-nowrap pb-2 sm:snap-proximity"
      >
        <ProductRow products={products} />
      </div>
      <ScrollArrowButtons className="-mt-12" {...scrollArrowProps} />
    </div>
  );
};

export default ProductCarousel;
