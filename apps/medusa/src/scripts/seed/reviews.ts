export const texasCustomers = [
  {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "5125550101",
    city: "Austin",
    address_1: "1200 S Lamar Blvd",
    postal_code: "78704",
  },
  {
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.j@example.com",
    phone: "5125550102",
    city: "Houston",
    address_1: "3300 Smith St",
    postal_code: "77006",
  },
  {
    first_name: "Miguel",
    last_name: "Rodriguez",
    email: "miguel.r@example.com",
    phone: "5125550103",
    city: "San Antonio",
    address_1: "450 Alamo Plaza",
    postal_code: "78205",
  },
  {
    first_name: "Emily",
    last_name: "Chen",
    email: "emily.c@example.com",
    phone: "5125550104",
    city: "Dallas",
    address_1: "1500 Marilla St",
    postal_code: "75201",
  },
  {
    first_name: "Robert",
    last_name: "Williams",
    email: "robert.w@example.com",
    phone: "5125550105",
    city: "Fort Worth",
    address_1: "200 Texas St",
    postal_code: "76102",
  },
  {
    first_name: "Jessica",
    last_name: "Martinez",
    email: "jessica.m@example.com",
    phone: "5125550106",
    city: "El Paso",
    address_1: "123 Mesa St",
    postal_code: "79901",
  },
  {
    first_name: "David",
    last_name: "Thompson",
    email: "david.t@example.com",
    phone: "5125550107",
    city: "Corpus Christi",
    address_1: "456 Shoreline Blvd",
    postal_code: "78401",
  },
  {
    first_name: "Lisa",
    last_name: "Garcia",
    email: "lisa.g@example.com",
    phone: "5125550108",
    city: "Plano",
    address_1: "789 Legacy Dr",
    postal_code: "75024",
  },
  {
    first_name: "James",
    last_name: "Wilson",
    email: "james.w@example.com",
    phone: "5125550109",
    city: "Lubbock",
    address_1: "321 Texas Tech Pkwy",
    postal_code: "79409",
  },
  {
    first_name: "Maria",
    last_name: "Lopez",
    email: "maria.l@example.com",
    phone: "5125550110",
    city: "Laredo",
    address_1: "555 San Bernardo Ave",
    postal_code: "78040",
  },
  {
    first_name: "Thomas",
    last_name: "Brown",
    email: "thomas.b@example.com",
    phone: "5125550111",
    city: "Galveston",
    address_1: "123 Seawall Blvd",
    postal_code: "77550",
  },
  {
    first_name: "Jennifer",
    last_name: "Davis",
    email: "jennifer.d@example.com",
    phone: "5125550112",
    city: "Amarillo",
    address_1: "456 Polk St",
    postal_code: "79101",
  },
  {
    first_name: "Michael",
    last_name: "Anderson",
    email: "michael.a@example.com",
    phone: "5125550113",
    city: "Waco",
    address_1: "789 University Parks Dr",
    postal_code: "76706",
  },
  {
    first_name: "Amanda",
    last_name: "Taylor",
    email: "amanda.t@example.com",
    phone: "5125550114",
    city: "Tyler",
    address_1: "321 Broadway Ave",
    postal_code: "75701",
  },
  {
    first_name: "Christopher",
    last_name: "Hernandez",
    email: "chris.h@example.com",
    phone: "5125550115",
    city: "Abilene",
    address_1: "555 Pine St",
    postal_code: "79601",
  },
];

export const reviewContents = [
  {
    rating: 5,
    content: "Perfect fit and really soft fabric. Looks great out of the box.",
  },
  {
    rating: 4,
    content: "Nice quality and true to size. Shipping was fast.",
  },
  {
    rating: 3,
    content: "Decent piece. Fabric is okay but not amazing.",
  },
  {
    rating: 2,
    content: "Fit was off for me. Returning for a different size.",
  },
  {
    rating: 5,
    content: "Love the color and the drape. I wear it all the time.",
  },
  {
    rating: 4,
    content: "Great everyday staple. Matches a lot of outfits.",
  },
  {
    rating: 5,
    content: "Exceeded expectations. The stitching is clean and the fit is sharp.",
  },
  {
    rating: 3,
    content: "Okay overall. I might try another color.",
  },
  {
    rating: 1,
    content: "Did not match the photos. Material felt cheap.",
  },
  {
    rating: 4,
    content: "Comfortable and looks good. Would buy again.",
  },
  {
    rating: 5,
    content: "Love it. Perfect for layering and feels premium.",
  },
  {
    rating: 2,
    content: "Color was different than expected.",
  },
  {
    rating: 4,
    content: "Solid value and good cut for the price.",
  },
  {
    rating: 3,
    content: "Average. Not bad but not my favorite.",
  },
  {
    rating: 5,
    content: "Amazing quality and finish. Worth it.",
  },
];

export function generateReviewResponse(review: { rating: number; name: string | null }) {
  const rating = review.rating;
  const firstName = review.name?.split(" ")[0] ?? "Customer";

  if (rating >= 4) {
    const positiveResponses = [
      `Thanks for the great feedback, ${firstName}! We are glad this piece fits your style.`,
      `Appreciate the review, ${firstName}! Happy to hear the fit worked well.`,
      `Thanks for sharing! We are thrilled you love the quality.`,
      `Great to hear this worked out for you, ${firstName}. Enjoy!`,
      `Thank you for the kind words. We love that you are enjoying it!`,
    ];
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  }

  if (rating === 3) {
    const neutralResponses = [
      `Thanks for the honest feedback, ${firstName}. We are working to improve.`,
      `Appreciate the review. If you want a different fit, we can help with sizing.`,
      `Thanks for sharing your experience. We will keep refining.`,
      `We value your input, ${firstName}. Let us know how we can do better.`,
      `Thanks for the feedback. We would love to help you find a better match.`,
    ];
    return neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
  }

  const negativeResponses = [
    `Sorry this missed the mark, ${firstName}. We would like to make it right.`,
    `We appreciate the feedback and will look into this issue.`,
    `Sorry to hear that. Please reach out and we will help with a return or exchange.`,
    `We are disappointed to hear this. Your feedback helps us improve.`,
    `Thank you for the honest review. We would like to fix this for you.`,
  ];
  return negativeResponses[Math.floor(Math.random() * negativeResponses.length)];
}
