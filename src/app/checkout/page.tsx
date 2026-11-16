"use client";

import { isDb } from "@/lib/backend";
import DbCheckout from "@/components/checkout/DbCheckout";
import ShopifyCheckoutRedirect from "@/components/checkout/ShopifyCheckoutRedirect";

/** "db": our own one-page checkout. "shopify": hands the cart over to Shopify's hosted checkout. */
export default function CheckoutPage() {
  return isDb ? <DbCheckout /> : <ShopifyCheckoutRedirect />;
}
