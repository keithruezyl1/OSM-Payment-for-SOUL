import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/product";
import SellerModule from "../modules/seller";

export default defineLink(
  { linkable: ProductModule.linkable.product, isList: true },
  { linkable: SellerModule.linkable.seller, isList: false },
  {
    database: {
      table: "seller_product",
      idPrefix: "selprod",
    },
  },
);
