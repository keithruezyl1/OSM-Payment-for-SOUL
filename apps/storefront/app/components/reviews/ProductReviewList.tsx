import { StoreProductReview } from '@lambdacurry/medusa-plugins-sdk';
import { formatDate } from '@libs/util';
import { type FC } from 'react';
import { StarRating } from './StarRating';

export interface ProductReviewListProps {
  productReviews?: StoreProductReview[];
  className?: string;
}

export const ProductReviewList: FC<ProductReviewListProps> = ({ productReviews }) => {
  return (
    <div>
      {productReviews && productReviews.length > 0 && (
        <div className="-my-12 divide-y divide-gray-200">
          {productReviews.map((review, reviewIndex) => {
            return (
              <div key={review.id} className="py-8">
                <div className=" flex items-center justify-between">
                  <h3 className="mr-2 text-sm font-bold ">{review.name ?? 'Anonymous'}</h3>
                  <div className="mt-1 flex items-center pb-1">
                    <StarRating value={review.rating ?? 0} readOnly />
                  </div>
                  <p className="sr-only">{review.rating} out of 5 stars</p>
                </div>
                <time className="text-xs italic text-gray-900" dateTime={review.created_at}>
                  {formatDate(new Date(review.created_at))}
                </time>

                <div
                  className="mt-4 space-y-6 text-base italic text-gray-600"
                  dangerouslySetInnerHTML={{ __html: review.content }}
                />

                {/* Store Owner Response */}
                {review.response && review.response.content && (
                  <div className="mt-4 rounded-md bg-gray-50 p-4">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">Seller Response</h4>
                      {review.response.created_at && (
                        <time
                          className="ml-2 text-xs italic text-gray-500"
                          dateTime={String(review.response.created_at)}
                        >
                          {formatDate(new Date(review.response.created_at))}
                        </time>
                      )}
                    </div>
                    <div
                      className="mt-2 text-sm text-gray-700"
                      dangerouslySetInnerHTML={{ __html: review.response.content }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

