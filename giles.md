# Fix: All Product Prices Showing `$0.00`

## Root Cause
Prices are seeded from `apps/medusa/src/scripts/seed/products.ts`.  
Medusa expects amounts in **minor units** (cents), not whole dollars.

If seed data is stale or seeded in major units, storefront renders `$0.00` (or wrong amounts).

## Exact Fix Steps

1. Confirm seed pricing logic uses cents:
   - Open `apps/medusa/src/scripts/seed/products.ts`
   - Ensure product prices are:
     - `usd: group.basePrice * 100`
     - `cad: (group.basePrice + 10) * 100`

2. Rebuild DB + reseed (required; code change alone is not enough):
   ```bash
   yarn run medusa:init
   ```

3. Copy the new publishable key printed by init log:
   - Look for: `PUBLISHABLE API KEY: pk_...`

4. Update storefront env:
   - File: `apps/storefront/.env`
   - Set:
     ```env
     MEDUSA_PUBLISHABLE_KEY=pk_...
     ```

5. Restart apps:
   ```bash
   yarn dev
   ```

6. Hard refresh browser:
   - `Ctrl + F5` on `/products` and PDP pages.

## API Verification (must pass)

Use Postman or terminal with header:
- `x-publishable-api-key: <current pk_...>`

Get a region ID first: `GET http://localhost:9000/store/regions` (e.g. `reg_01KJBTZK9WGCZXM4FHVW9VH6S6`).

Call:
```http
GET http://localhost:9000/store/marketplace/products?limit=1&offset=0&region_id=<region_id>
```

Expected:
- `products[0].variants[0].calculated_price.calculated_amount` is a positive number (not 0)
- Storefront cards/PDP no longer show `$0.00`

## If Still `$0.00`

1. Key mismatch:
   - `apps/storefront/.env` has old `MEDUSA_PUBLISHABLE_KEY`
2. Server not restarted after env change
3. Browser cache not refreshed
4. `medusa:init` not rerun after seed edits
5. **Variant–price link missing**: Run the repair script:
   ```bash
   cd apps/medusa && npx medusa exec ./src/scripts/repair-variant-prices.ts
   ```
