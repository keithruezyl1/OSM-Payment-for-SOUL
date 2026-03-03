import clsx from 'clsx';
import { FC, HTMLAttributes } from 'react';

export interface PageHeadingProps extends HTMLAttributes<HTMLHeadingElement> {}

export const PageHeading: FC<PageHeadingProps> = ({ className, ...props }) => (
  <h1 className={clsx('max-w-full break-words text-4xl font-bold tracking-tight md:text-6xl', className)} {...props} />
);
