# REST API Documentation for ServiceNow Integration

This document outlines the essential REST API endpoints for both Medusa (OMS) and Stripe (Payment Gateway) to be used in the ServiceNow Integration Hub.

## Medusa REST API (localhost:9000)

All store requests must include the `x-publishable-api-key`.

**Base URL**: `http://[MEDUSA_HOST]:9000/store`
**Header**: `x-publishable-api-key: pk_d63b25f235c0d4eef33599004249dcf6f6909a2e0c8f0b2ac377f6e5bfc3c98e`

### 1. Create a Cart
Used to start a new order session.
- **Endpoint**: `POST /carts`
- **Body**: `{ "region_id": "reg_01KJBTZK9WGCZXM4FHVW9VH6S6" }`
- **Success Response**: `201 Created` with cart object.

### 2. Add Line Item
Add mocked products to the cart.
- **Endpoint**: `POST /carts/[CART_ID]/line-items`
- **Body**: `{ "variant_id": "variant_...", "quantity": 1 }`

### 3. Initialize Payment Session (Stripe)
This creates the Stripe Payment Intent.
- **Endpoint**: `POST /carts/[CART_ID]/payment-collections`
- **Body**: `{ "provider_id": "pp_stripe_stripe" }`

### 4. Create Order (Place Order)
Finalizes the checkout after payment is authorized.
- **Endpoint**: `POST /carts/[CART_ID]/checkout`

### 5. Get Order Details
Retrieve order status for ServiceNow tracking.
- **Endpoint**: `GET /orders/[ORDER_ID]`

---

## Stripe REST API (api.stripe.com)

ServiceNow can connect directly to Stripe for detailed payment status.

**Base URL**: `https://api.stripe.com/v1`
**Auth**: Bearer Token `[STRIPE_SECRET_KEY]`

### 1. Retrieve Payment Intent
Check if a payment was successful.
- **Endpoint**: `GET /payment_intents/[PAYMENT_INTENT_ID]`

### 2. List Transactions (Orders)
- **Endpoint**: `GET /balance_transactions`

---

## Mock Data Info
- **Stripe Test Card**: `4242 4242 4242 4242` (Expiry: Future, CVC: Any)
- **Medusa Product IDs**: Use the IDs from your local database (list them via `GET /store/products`).

## Example cURL for ServiceNow
```bash
curl -X POST http://localhost:9000/store/carts \
  -H "x-publishable-api-key: pk_d63b25f235c0d4eef33599004249dcf6f6909a2e0c8f0b2ac377f6e5bfc3c98e" \
  -H "Content-Type: application/json" \
  -d '{"region_id": "reg_01KJBTZK9WGCZXM4FHVW9VH6S6"}'
```
