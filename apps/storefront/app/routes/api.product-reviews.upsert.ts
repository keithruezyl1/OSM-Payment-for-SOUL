import { zodResolver } from '@hookform/resolvers/zod';
import { StoreUpsertProductReviewsDTO } from '@lambdacurry/medusa-plugins-sdk';
import { reviewsFileUploadHandler, upsertProductReviews } from '@libs/util/server/data/product-reviews.server';
import { parseFormData } from '@mjackson/form-data-parser';
import { data } from 'react-router';
import { getValidatedFormData } from 'remix-hook-form';
import { z } from 'zod';

const schema = z.object({
  id: z.string().optional(),
  order_id: z.string().min(1, 'Order is required'),
  order_line_item_id: z.string().min(1, 'Line item is required'),
  rating: z.number().min(1, 'Rating is required'),
  content: z.string().optional().default(''),
  review_request_id: z.string().optional(),
});

export async function action({ request }: { request: Request }) {
  const formData = await parseFormData(request, reviewsFileUploadHandler);
  const { errors, data: parsedFormData } = await getValidatedFormData(formData, zodResolver(schema));

  if (errors) {
    return data({ errors }, { status: 400 });
  }

  try {
    const reviewPayload: StoreUpsertProductReviewsDTO['reviews'][number] = {
      order_id: parsedFormData.order_id,
      order_line_item_id: parsedFormData.order_line_item_id,
      rating: parsedFormData.rating,
      content: parsedFormData.content,
      images: [],
    };

    const { product_reviews } = await upsertProductReviews(request, {
      reviews: [reviewPayload],
    });

    return data({ product_reviews, success: true });
  } catch (error: any) {
    console.error('product reviews error', error);
    return data(
      { errors: { root: { message: 'Something went wrong when creating or updating your product reviews.' } } },
      { status: 500 },
    );
  }
}
