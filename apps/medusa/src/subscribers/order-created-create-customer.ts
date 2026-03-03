import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export default async function orderCreatedCreateCustomer({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER);
  const customerService = container.resolve(Modules.CUSTOMER);

  const order = await orderService.retrieveOrder(data.id, {
    select: ["id", "email", "customer_id"],
    relations: ["shipping_address", "billing_address"],
  });

  if (!order || order.customer_id || !order.email) return;

  const existing = await customerService.listCustomers({ email: order.email }, { take: 1 });
  let customer = existing?.[0];

  if (!customer) {
    const address = order.shipping_address || order.billing_address;
    customer = await customerService.createCustomers({
      email: order.email,
      first_name: address?.first_name || "",
      last_name: address?.last_name || "",
      phone: address?.phone || undefined,
      metadata: {
        created_from: "checkout",
      },
      addresses: address
        ? [
            {
              address_1: address.address_1,
              address_2: address.address_2,
              city: address.city,
              province: address.province,
              postal_code: address.postal_code,
              country_code: address.country_code,
              phone: address.phone,
            },
          ]
        : [],
    });
  }

  if (customer?.id) {
    await orderService.updateOrders(order.id, { customer_id: customer.id });
  }
}

export const config: SubscriberConfig = {
  event: "order.created",
};
