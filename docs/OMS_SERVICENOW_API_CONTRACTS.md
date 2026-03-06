# OMS to ServiceNow API Contracts

## Purpose
This document defines the REST contracts needed to extract OMS data into ServiceNow Integration Hub for these target tables:

1. `x_eygds_soul_sn_order_case`
2. `x_eygds_soul_refund_policy`
3. `x_eygds_soul_order_refund_line`
4. `x_eygds_soul_refund_request`
5. `x_eygds_soul_oms_order_integration`
6. `x_eygds_soul_payment_system`

It includes:
- Existing endpoints in this repo (already live)
- Required OMS extraction endpoints (to implement)
- Field mapping from OMS response to ServiceNow fields
- Request/response schemas and examples

---

## API Base
- Base URL: `https://osm-payment-for-soul.onrender.com`
- Content-Type: `application/json`

## Authentication
For extraction endpoints, use one of these patterns:

1. `x-oms-integration-key: <secret>` (recommended for ServiceNow)
2. `Authorization: Bearer <token>` (if you add token auth middleware)

For current storefront endpoints (`/store/*`), Medusa publishable key is required:
- `x-publishable-api-key: pk_...`

## Credentials Matrix (What ServiceNow Needs)

| Credential Name | Required For | Where to Store | How Used |
|---|---|---|---|
| `OMS_BASE_URL` | All OMS extraction endpoints | ServiceNow Connection & Credential Alias | Base URL for all REST calls (`https://osm-payment-for-soul.onrender.com`) |
| `OMS_INTEGRATION_KEY` | `/store/oms/*` endpoints | ServiceNow Credential record (secret) | Sent as header: `x-oms-integration-key: <secret>` |
| `MEDUSA_PUBLISHABLE_KEY` | Current `/store/marketplace/products`, `/store/sellers*` | ServiceNow Credential record (secret) | Sent as header: `x-publishable-api-key: pk_...` |
| `STRIPE_SECRET_KEY` | Optional direct Stripe reconciliation | ServiceNow Credential record (secret) | Sent as `Authorization: Bearer sk_...` to Stripe API |

Notes:
- Preferred auth for new OMS extraction endpoints is `x-oms-integration-key`.
- Use `MEDUSA_PUBLISHABLE_KEY` only for existing store endpoints.
- If you expose both, keep both keys separate and rotate independently.

## Extraction Matrix (Data Needed -> How to Extract)

The tables below map each ServiceNow field to:
- Source endpoint
- JSON path
- Transform rules
- Credential required

### A) `x_eygds_soul_sn_order_case`

| ServiceNow Field | OMS Source Endpoint | JSON Path | Transform / Rules | Credential |
|---|---|---|---|---|
| `order_id` | `GET /store/oms/order-cases` | `order_cases[].order_id` | Required, string | `x-oms-integration-key` |
| `transaction_id` | `GET /store/oms/order-cases` | `order_cases[].transaction_id` | Required, string | `x-oms-integration-key` |
| `total_refundable` | `GET /store/oms/order-cases` | `order_cases[].total_refundable` | Required decimal; round to 2dp | `x-oms-integration-key` |
| `ai_confidence` | `GET /store/oms/order-cases` | `order_cases[].ai_confidence` | Optional decimal 0.00-1.00 | `x-oms-integration-key` |
| `evidence_bundle` | `GET /store/oms/order-cases` | `order_cases[].evidence_bundle` | Optional JSON-string, max 600 chars | `x-oms-integration-key` |

### B) `x_eygds_soul_refund_policy`

| ServiceNow Field | OMS Source Endpoint | JSON Path | Transform / Rules | Credential |
|---|---|---|---|---|
| `category` | `GET /store/oms/refund-policies` | `policies[].category` | Required choice: `electronics|fashion|furniture` | `x-oms-integration-key` |
| `refund_window` | `GET /store/oms/refund-policies` | `policies[].refund_window` | Required integer days | `x-oms-integration-key` |
| `auto_threshold` | `GET /store/oms/refund-policies` | `policies[].auto_threshold` | Required decimal | `x-oms-integration-key` |
| `restocking_fee` | `GET /store/oms/refund-policies` | `policies[].restocking_fee` | Optional decimal | `x-oms-integration-key` |

### C) `x_eygds_soul_order_refund_line`

| ServiceNow Field | OMS Source Endpoint | JSON Path | Transform / Rules | Credential |
|---|---|---|---|---|
| `parent_case` | `GET /store/oms/refund-lines` | `refund_lines[].parent_case_order_id` | Lookup Order Case by `order_id`, then map to `sys_id` | `x-oms-integration-key` |
| `sold_product` | `GET /store/oms/refund-lines` | `refund_lines[].sold_product` | Required reference value | `x-oms-integration-key` |
| `refund_reason` | `GET /store/oms/refund-lines` | `refund_lines[].refund_reason` | Required choice: `wrong_item|damaged_arrival|defecting|mind_change|not_as_described|missing_parts|late_delivery|counterfeit|better_price` | `x-oms-integration-key` |
| `condition` | `GET /store/oms/refund-lines` | `refund_lines[].condition` | Optional choice: `grade_a|grade_b|grade_c|grade_d` | `x-oms-integration-key` |
| `return_required` | `GET /store/oms/refund-lines` | `refund_lines[].return_required` | Required choice: `yes|no` | `x-oms-integration-key` |
| `line_total` | `GET /store/oms/refund-lines` | `refund_lines[].line_total` | Required decimal | `x-oms-integration-key` |

### D) `x_eygds_soul_refund_request`

| ServiceNow Field | OMS Source Endpoint | JSON Path | Transform / Rules | Credential |
|---|---|---|---|---|
| `parent_case` | `GET /store/oms/refund-requests` | `refund_requests[].parent_case_order_id` | Lookup Order Case by `order_id`, then map to `sys_id` | `x-oms-integration-key` |
| `request_id` | `GET /store/oms/refund-requests` | `refund_requests[].request_id` | Required, unique string | `x-oms-integration-key` |
| `refund_amount` | `GET /store/oms/refund-requests` | `refund_requests[].refund_amount` | Required decimal | `x-oms-integration-key` |
| `transaction_reference` | `GET /store/oms/refund-requests` | `refund_requests[].transaction_reference` | Required string | `x-oms-integration-key` |
| `payment_method` | `GET /store/oms/refund-requests` | `refund_requests[].payment_method` | Required choice: `credit_card|debit_card|digital_wallet|store_credit|gift_card|COD|bank_transfer|BNPL|original_payment_method` | `x-oms-integration-key` |
| `approval_state` | `GET /store/oms/refund-requests` | `refund_requests[].approval_state` | Required choice: `draft|pending_approval|approved|executed|failed` | `x-oms-integration-key` |
| `settlement_note` | `GET /store/oms/refund-requests` | `refund_requests[].settlement_note` | Optional journal text | `x-oms-integration-key` |

### E) `x_eygds_soul_oms_order_integration`

| ServiceNow Field | OMS Source Endpoint | JSON Path | Transform / Rules | Credential |
|---|---|---|---|---|
| `customer_id` | `GET /store/oms/orders` | `orders[].customer_id` | Optional reference string | `x-oms-integration-key` |
| `external_last_sync` | Integration runtime | N/A | Set to job execution timestamp | N/A |
| `created_at` | `GET /store/oms/orders` | `orders[].created_at` | Convert to ServiceNow Date | `x-oms-integration-key` |
| `display_id` | `GET /store/oms/orders` | `orders[].display_id` | Cast to string | `x-oms-integration-key` |
| `order_status` | `GET /store/oms/orders` | `orders[].order_status` | Normalize to `shipped|delivered|returned` | `x-oms-integration-key` |
| `items` | `GET /store/oms/orders` | `orders[].items` | JSON-stringify snapshot payload | `x-oms-integration-key` |
| `total` | `GET /store/oms/orders` | `orders[].total` | Convert minor to decimal if needed (`/100`) | `x-oms-integration-key` |
| `transaction_id` | `GET /store/oms/orders` | `orders[].transaction_id` | String | `x-oms-integration-key` |

### F) `x_eygds_soul_payment_system`

| ServiceNow Field | OMS Source Endpoint | JSON Path | Transform / Rules | Credential |
|---|---|---|---|---|
| `payment_intent` | `GET /store/oms/payment-transactions` | `payments[].payment_intent` | String | `x-oms-integration-key` |
| `payment_method_details` | `GET /store/oms/payment-transactions` | `payments[].payment_method_details` | Choice: `card|ach_debit` | `x-oms-integration-key` |
| `amount` | `GET /store/oms/payment-transactions` | `payments[].amount` | Decimal | `x-oms-integration-key` |
| `id` | `GET /store/oms/payment-transactions` | `payments[].id` | Transaction reference string | `x-oms-integration-key` |
| `metadata` | `GET /store/oms/payment-transactions` | `payments[].metadata` | String (JSON-string allowed) | `x-oms-integration-key` |
| `status` | `GET /store/oms/payment-transactions` | `payments[].status` | Choice: `pending|succeeded|failed` | `x-oms-integration-key` |

---

## Endpoint Credentials Field (Per Call Template)

Use this standard request template in Integration Hub actions:

```http
GET {{OMS_BASE_URL}}/store/oms/orders?updated_from={{watermark}}
x-oms-integration-key: {{OMS_INTEGRATION_KEY}}
accept: application/json
```

For currently live endpoints that still rely on Medusa publishable key:

```http
GET {{OMS_BASE_URL}}/store/marketplace/products?limit=50
x-publishable-api-key: {{MEDUSA_PUBLISHABLE_KEY}}
accept: application/json
```

Credential fields to create in ServiceNow:
- `credential.oms_base_url`
- `credential.oms_integration_key`
- `credential.medusa_publishable_key`
- `credential.stripe_secret_key` (only if you do direct Stripe fallback/reconciliation)

---

## Current Endpoints (Already Implemented)

### GET `/store/marketplace/products`
Returns marketplace products with seller enrichment and ETA.

Useful fields now:
- `id`, `title`, `handle`, `description`
- `variants[]` with calculated price
- `seller.id`, `seller.name`, `seller.handle`, `seller.rating`, `seller.review_count`, `seller.city`, `seller.state`, `seller.zip`
- `eta_days`

### GET `/store/sellers`
Returns paginated sellers.

### GET `/store/sellers/:handle`
Returns seller profile by handle.

These endpoints are useful for catalog sync, but not sufficient for refund/case/payment extraction.

---

## Required OMS Extraction Endpoints

## 1) Orders Integration Feed
### GET `/store/oms/orders`
Use this as the primary source for `x_eygds_soul_oms_order_integration`.

Query params:
- `updated_from` (ISO datetime, optional)
- `updated_to` (ISO datetime, optional)
- `status` (optional: `shipped|delivered|returned`)
- `limit` (default 100, max 500)
- `offset` (default 0)

Response:
```json
{
  "count": 1,
  "offset": 0,
  "limit": 100,
  "orders": [
    {
      "id": "ord_01...",
      "display_id": 1001,
      "created_at": "2026-03-06T01:40:00.000Z",
      "updated_at": "2026-03-06T02:00:00.000Z",
      "order_status": "delivered",
      "customer_id": "cus_01...",
      "items": [
        {
          "line_item_id": "item_01...",
          "product_id": "prod_01...",
          "variant_id": "variant_01...",
          "title": "Slim Chino Pants",
          "sku": "MEN-1-XS-BLACK",
          "quantity": 1,
          "unit_price": 2199,
          "line_total": 2199
        }
      ],
      "total": 2199,
      "currency_code": "usd",
      "transaction_id": "pi_3Q..."
    }
  ]
}
```

ServiceNow mapping (`x_eygds_soul_oms_order_integration`):
- `customer_id` <- `orders[].customer_id`
- `external_last_sync` <- integration runtime timestamp
- `created_at` <- `orders[].created_at`
- `display_id` <- `orders[].display_id` (string in ServiceNow)
- `order_status` <- `orders[].order_status`
- `items` <- JSON-stringified `orders[].items`
- `total` <- decimal `orders[].total / 100` (if minor units)
- `transaction_id` <- `orders[].transaction_id`

---

## 2) Order Case Feed
### GET `/store/oms/order-cases`
Case-oriented view derived from orders + payment + refund availability.

Query params:
- `updated_from`, `updated_to`, `limit`, `offset`

Response:
```json
{
  "count": 1,
  "order_cases": [
    {
      "order_id": "ord_01...",
      "transaction_id": "pi_3Q...",
      "total_refundable": 21.99,
      "ai_confidence": null,
      "evidence_bundle": null
    }
  ]
}
```

ServiceNow mapping (`x_eygds_soul_sn_order_case`):
- `order_id` <- `order_cases[].order_id`
- `transaction_id` <- `order_cases[].transaction_id`
- `total_refundable` <- `order_cases[].total_refundable`
- `ai_confidence` <- `order_cases[].ai_confidence`
- `evidence_bundle` <- `order_cases[].evidence_bundle` (JSON string up to 600 chars)

---

## 3) Refund Policy Feed
### GET `/store/oms/refund-policies`
Master data endpoint for your policy table.

Query params:
- `category` (optional)

Response:
```json
{
  "policies": [
    {
      "id": "rpol_fashion_default",
      "category": "fashion",
      "refund_window": 14,
      "auto_threshold": 25.00,
      "restocking_fee": 0.00,
      "updated_at": "2026-03-06T00:00:00.000Z"
    }
  ]
}
```

ServiceNow mapping (`x_eygds_soul_refund_policy`):
- `category` <- `policies[].category`
- `refund_window` <- `policies[].refund_window`
- `auto_threshold` <- `policies[].auto_threshold`
- `restocking_fee` <- `policies[].restocking_fee`

---

## 4) Refund Lines Feed
### GET `/store/oms/refund-lines`
Line-level candidates for refund evaluation.

Query params:
- `order_id` (optional)
- `case_id` (optional)
- `updated_from`, `updated_to`, `limit`, `offset`

Response:
```json
{
  "count": 1,
  "refund_lines": [
    {
      "id": "rline_01...",
      "parent_case_order_id": "ord_01...",
      "sold_product": "sold_prod_01...",
      "refund_reason": "damaged_arrival",
      "condition": "grade_b",
      "return_required": "yes",
      "line_total": 21.99,
      "updated_at": "2026-03-06T02:10:00.000Z"
    }
  ]
}
```

ServiceNow mapping (`x_eygds_soul_order_refund_line`):
- `parent_case` <- lookup by `parent_case_order_id` to Order Case sys_id
- `sold_product` <- `refund_lines[].sold_product`
- `refund_reason` <- `refund_lines[].refund_reason`
- `condition` <- `refund_lines[].condition`
- `return_required` <- `refund_lines[].return_required`
- `line_total` <- `refund_lines[].line_total`

Allowed values:
- `refund_reason`: `wrong_item|damaged_arrival|defecting|mind_change|not_as_described|missing_parts|late_delivery|counterfeit|better_price`
- `condition`: `grade_a|grade_b|grade_c|grade_d`
- `return_required`: `yes|no`

---

## 5) Refund Requests Feed
### GET `/store/oms/refund-requests`
Refund state machine + execution details.

Query params:
- `approval_state` (optional)
- `updated_from`, `updated_to`, `limit`, `offset`

Response:
```json
{
  "count": 1,
  "refund_requests": [
    {
      "request_id": "rr_01...",
      "parent_case_order_id": "ord_01...",
      "refund_amount": 21.99,
      "transaction_reference": "re_3Q...",
      "payment_method": "credit_card",
      "approval_state": "approved",
      "settlement_note": "Auto-approved under threshold.",
      "updated_at": "2026-03-06T02:20:00.000Z"
    }
  ]
}
```

ServiceNow mapping (`x_eygds_soul_refund_request`):
- `parent_case` <- lookup by `parent_case_order_id`
- `request_id` <- `refund_requests[].request_id`
- `refund_amount` <- `refund_requests[].refund_amount`
- `transaction_reference` <- `refund_requests[].transaction_reference`
- `payment_method` <- `refund_requests[].payment_method`
- `approval_state` <- `refund_requests[].approval_state`
- `settlement_note` <- `refund_requests[].settlement_note`

Allowed values:
- `payment_method`: `credit_card|debit_card|digital_wallet|store_credit|gift_card|COD|bank_transfer|BNPL|original_payment_method`
- `approval_state`: `draft|pending_approval|approved|executed|failed`

---

## 6) Payment System Feed
### GET `/store/oms/payment-transactions`
Normalized payment/refund transaction stream.

Query params:
- `status` (optional: `pending|succeeded|failed`)
- `updated_from`, `updated_to`, `limit`, `offset`

Response:
```json
{
  "count": 1,
  "payments": [
    {
      "id": "re_3Q...",
      "payment_intent": "pi_3Q...",
      "payment_method_details": "card",
      "amount": 21.99,
      "metadata": "{\"source\":\"stripe\",\"order_id\":\"ord_01...\"}",
      "status": "succeeded",
      "updated_at": "2026-03-06T02:30:00.000Z"
    }
  ]
}
```

ServiceNow mapping (`x_eygds_soul_payment_system`):
- `payment_intent` <- `payments[].payment_intent`
- `payment_method_details` <- `payments[].payment_method_details`
- `amount` <- `payments[].amount`
- `id` <- `payments[].id`
- `metadata` <- `payments[].metadata` (string)
- `status` <- `payments[].status`

Allowed values:
- `payment_method_details`: `card|ach_debit`
- `status`: `pending|succeeded|failed`

---

## Delta Sync Contract (All OMS extraction endpoints)

Use these standard fields in each response object:
- `updated_at` (required)
- stable `id` or unique business key

Recommended ServiceNow ingestion logic:
1. Keep per-endpoint watermark: `last_successful_sync_at`
2. Call endpoint with `updated_from=watermark`
3. Upsert into target table by unique key
4. On success, advance watermark to max `updated_at` seen

---

## Error Contract

All endpoints should return:
```json
{
  "type": "invalid_request",
  "message": "Human-readable message",
  "code": "optional_machine_code"
}
```

Status codes:
- `200` success
- `400` invalid query params
- `401` missing/invalid integration credentials
- `404` specific resource not found
- `500` internal processing error

---

## Suggested Implementation Priority

1. `/store/oms/orders`
2. `/store/oms/order-cases`
3. `/store/oms/payment-transactions`
4. `/store/oms/refund-requests`
5. `/store/oms/refund-lines`
6. `/store/oms/refund-policies`

This order gives ServiceNow a usable baseline earliest (orders + payment) before policy/approval enrichments.

---

## Notes About Current Data Availability

- Seller/catalog data is already exposed and ready.
- Customer linking on guest checkout is implemented via subscriber (`order.created` -> customer create/link).
- Refund policy, approval workflow state, and custom case/line records are not native in current Medusa modules and require custom storage + routes.
- If Admin remains disabled in prod, extraction endpoints should not depend on Admin authentication UI; use integration-key auth middleware.
