# Product Pricing Architecture

## Overview

Medusa v2 uses a **modular architecture** where products and prices live in separate modules, connected by links.

## Data Model & Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCT MODULE                                       │
│  ┌─────────────┐       ┌──────────────────┐                                │
│  │   Product   │───────▶│ ProductVariant   │                                │
│  └─────────────┘       └────────┬─────────┘                                │
│                                 │                                            │
│                                 │ price_set_link (LinkProductVariantPriceSet) │
│                                 │ variant_id ◀──▶ price_set_id               │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRICING MODULE                                       │
│  ┌──────────────────┐       ┌──────────────────┐                            │
│  │    PriceSet      │───────▶│      Price       │  (currency_code, amount)   │
│  │  calculated_price│       └──────────────────┘                            │
│  └──────────────────┘                                                        │
│         │                                                                     │
│         │  Resolved at query time with context:                               │
│         │  { region_id, currency_code }                                       │
│         ▼                                                                     │
│  ┌──────────────────┐                                                         │
│  │ CalculatedPriceSet│  calculated_amount, original_amount                    │
│  └──────────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Tables / Entities

| Entity | Module | Purpose |
|--------|--------|---------|
| Product | Product | Product metadata, options, images |
| ProductVariant | Product | SKU, options, inventory link |
| LinkProductVariantPriceSet | Link | Connects variant_id to price_set_id |
| PriceSet | Pricing | Container for prices |
| Price | Pricing | Raw price (currency_code, amount in minor units) |
| CalculatedPriceSet | Pricing | Resolved price with context (region, tax, rules) |

## How the API Fetches Prices

### Primary Path (Remote Query)

1. **Entry point**: `product` – query starts from products
2. **Fields requested**: `variants.calculated_price`, `variants.price_set.prices`
3. **Context**: `{ region_id, currency_code }` – required for `calculated_price` resolution
4. **Flow**: Product → Variants → (via link) → PriceSet → Pricing Module resolves `calculated_price` with context

### Fallback Path (When calculated_price is null)

If the Pricing Module returns `null` for `calculated_price` (e.g. resolver edge case) but the variant has a linked PriceSet with raw prices:

1. Use `variants.price_set.prices` (raw Price[])
2. Find the Price matching `pricingContext.currency_code`
3. Set `calculated_price: { calculated_amount, original_amount }` from that Price

This uses the same underlying data (PriceSet → Price) without bypassing the link.

## Pricing Context Resolution

The API resolves `region_id` in this order:

1. **Query param** `region_id` – from storefront or client
2. **Store default** – `store.default_region_id`
3. **First region** – first region from `regionModuleService.listRegions()`

Without context, `calculated_price` cannot be resolved (currency unknown).

## Integrity Guarantees

- **No direct DB access** – all data flows through Medusa modules
- **Link required** – prices only appear when `ProductVariant` ↔ `PriceSet` link exists
- **Fallback is read-only** – uses `price_set.prices` from the same link; no new links created
- **Seed + repair** – `upsertVariantPricesWorkflow` creates PriceSets and links via official workflows
