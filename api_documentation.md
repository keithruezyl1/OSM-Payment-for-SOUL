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

## Data Extraction for ServiceNow (OMS to Stripe Mapping)

Use these endpoints and JSON paths to extract the fields required for ServiceNow.

### 1. Medusa OMS Extraction
**Endpoint**: `GET /store/orders/[ORDER_ID]`

| ServiceNow Field | JSON Path (from response root) | Notes |
| :--- | :--- | :--- |
| **Customer ID** | `order.customer_id` | Unique Medusa Customer UUID. |
| **Order ID** | `order.display_id` | Human-readable ID (e.g., `234522`). |
| **Order Date** | `order.created_at` | Format: ISO 8601 string. |
| **SKU Snapshot** | `order.items` | Array of objects. Extract `sku` and `quantity`. |
| **Total Refundable**| `order.total` | Expressed in smallest currency unit (e.g., cents). |

**Extraction cURL**:
```bash
curl -X GET http://localhost:9000/store/orders/[ORDER_ID] \
  -H "x-publishable-api-key: pk_d63b25f235c0d4eef33599004249dcf6f6909a2e0c8f0b2ac377f6e5bfc3c98e"
```

### 2. Stripe Payment Extraction
**Endpoint**: `GET /v1/payment_intents/[PAYMENT_INTENT_ID]`

| ServiceNow Field | JSON Path (from response root) | Notes |
| :--- | :--- | :--- |
| **Transaction ID** | `id` | The Stripe PaymentIntent ID (e.g., `pi_...`). |
| **Payment Method** | `payment_method_types[0]` | Primary method (e.g., `card`). |
| **Refund Status** | `status` | Maps: `succeeded` -> Settled, `processing` -> In Processing. |

**Refund Extraction (Specific Transaction)**:
**Endpoint**: `GET /v1/refunds/[REFUND_ID]`

| ServiceNow Field | JSON Path | Notes |
| :--- | :--- | :--- |
| **Refund Amount** | `amount` | Net value moved back to customer. |
| **Transaction Ref.** | `id` | The Refund ID (e.g., `re_...`). |
| **Settlement Note** | `metadata` | Check custom keys added during refund. |

**Extraction cURL**:
```bash
curl https://api.stripe.com/v1/payment_intents/[PAYMENT_INTENT_ID] \
  -u [STRIPE_SECRET_KEY]:
```

---

## Example Payload for SKU Snapshot
ServiceNow should parse the `order.items` array. Example structure:
```json
[
  {
    "sku": "SWEATSHIRT-M",
    "quantity": 2,
    "unit_price": 4500
  }
]
```

---

## ServiceNow IntegrationHub Implementation

To extract the data defined above into ServiceNow, follow these implementation steps using **IntegrationHub**.

### 1. Connection & Credential Setup
1. **Create a Connection & Credential Alias**:
   - One for **Medusa** (e.g., `Medusa_OMS`)
   - One for **Stripe** (e.g., `Stripe_Payment`)
2. **Define Connections**:
   - **Medusa**: Set URL to `http://[MEDUSA_HOST]:9000`. Use API Key for authentication (add `x-publishable-api-key` header).
   - **Stripe**: Set URL to `https://api.stripe.com`. Use Basic Auth with your Stripe Secret Key as the username (leave password blank).

### 2. Custom Action Development
Create custom actions for each data source:

#### **A. "Get Medusa Order Details" Action**
- **Inputs**: `Order ID` (String)
- **REST Step**:
  - **Connection**: Use `Medusa_OMS` alias.
  - **Resource Path**: `/store/orders/{order_id}`
  - **HTTP Method**: `GET`
- **Parsing**: Use a **JSON Parser** step or **Script step** to map the response to Action Outputs using the JSON paths defined in the [Medusa OMS Extraction](#1-medusa-oms-extraction) table.

#### **B. "Get Stripe Transaction" Action**
- **Inputs**: `Payment Intent ID` (String)
- **REST Step**:
  - **Connection**: Use `Stripe_Payment` alias.
  - **Resource Path**: `/v1/payment_intents/{pi_id}`
  - **HTTP Method**: `GET`
- **Parsing**: Extract fields using paths from the [Stripe Payment Extraction](#2-stripe-payment-extraction) table.

### 3. Flow Design Integration
Create a **Flow** to automate the extraction:
1. **Trigger**: (e.g., Scheduled Daily or Service Portal Record Producer)
2. **Steps**:
   - Call "Get Medusa Order Details".
   - Call "Get Stripe Transaction" using the `payment_intent_id` (if available in Medusa metadata or custom fields).
   - **Data Transformation**: Use a script step to format the "SKU Snapshot" array into a ServiceNow multi-line text field or related list records.
   - **Action**: Update the target ServiceNow record (e.g., Task, Incident, or Custom Table) with the extracted values.

> [!TIP]
> Use the **IntegrationHub Dashboard** to monitor the status of these API calls and debug any transformation errors in the execution logs.
