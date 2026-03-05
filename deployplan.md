# Deploy Gameplan: Render (Medusa) + Vercel (Storefront) + ServiceNow Integration Hub

## Summary
Deploy Medusa backend on Render and Remix storefront on Vercel, then connect ServiceNow Integration Hub to Medusa + Stripe REST APIs using secure credentials.  
This plan is a full manual runbook for tasks that require your platform accounts/secrets.

## Public API / Interface Impact
- No route path changes required.
- Production base URLs will change:
  - Medusa API: `https://<medusa-service>.onrender.com`
  - Storefront: `https://<storefront>.vercel.app` (and custom domain if added)
- ServiceNow will call:
  - Medusa Store APIs with `x-publishable-api-key`
  - Stripe APIs with `Authorization: Bearer <sk_...>`

## Preparation Checklist (everything to prepare)
1. **Repo/Code readiness**
- Confirm `main` (or release branch) includes seller-link fixes and marketplace endpoints.
- Ensure deployment compatibility for React Router on Vercel:
  - Add `@vercel/react-router`
  - Add `react-router.config.ts` with `presets: [vercelPreset()]`
  - Ensure custom `app/entry.server.tsx` uses `@vercel/react-router/entry.server` handler.
- Confirm storefront image assets exist in `apps/storefront/public`.

2. **Secrets and credentials readiness**
- Stripe keys ready for the target environment (test or live).
- Generate strong random values for:
  - `JWT_SECRET`
  - `COOKIE_SECRET`
- Decide final domains (Render URL + Vercel URL + custom domains).

3. **Render infrastructure readiness**
- Render PostgreSQL instance.
- Render Key Value (Redis/Valkey) instance.
- Render Node Web Service for Medusa.

4. **Vercel readiness**
- Vercel project connected to same Git repo.
- Monorepo configuration decided (recommended below).

5. **ServiceNow Integration readiness**
- Two credential aliases in Integration Hub:
  - Medusa Publishable Key (header credential)
  - Stripe Secret Key (bearer token credential)
- Endpoint list and auth headers documented for flows.

6. **Operational readiness**
- Health checks configured.
- Basic logs/alerts configured in Render + Vercel.
- Rollback approach decided (redeploy previous commit).

---

## Manual Instructions (do these yourself)

## 1) Deploy Medusa on Render
1. Create a **PostgreSQL** service in Render.
2. Create a **Key Value** service in Render.
3. Create a **Web Service** in Render from your GitHub repo.
4. Set service config:
- Runtime: `Node`
- Build Command:
```bash
corepack enable && yarn install --immutable && yarn --cwd apps/medusa build
```
- Start Command:
```bash
yarn --cwd apps/medusa start --host 0.0.0.0 --port $PORT
```
- Health Check Path: `/health`
5. Add environment variables in Render Web Service:
- `NODE_ENV=production`
- `PORT=10000`
- `HOST=0.0.0.0`
- `DATABASE_URL=<Render Postgres Internal URL>`
- `REDIS_URL=<Render Key Value Internal URL>`
- `STORE_CORS=https://<your-vercel-domain>,https://<your-custom-store-domain-if-any>`
- `ADMIN_CORS=https://<your-render-medusa-domain>`
- `AUTH_CORS=https://<your-vercel-domain>,https://<your-render-medusa-domain>`
- `JWT_SECRET=<strong-random>`
- `COOKIE_SECRET=<strong-random>`
- `ADMIN_BACKEND_URL=https://<your-render-medusa-domain>`
- `STRIPE_API_KEY=<sk_test_or_live>`
- `STRIPE_WEBHOOK_SECRET=<set after webhook creation>`
6. Set a **Pre-Deploy Command** in Render:
```bash
yarn --cwd apps/medusa run migrate && yarn --cwd apps/medusa run sync
```

## 2) Initialize production data in Medusa (Render Shell / one-off job)
Run these one time from Render Shell:
```bash
yarn --cwd apps/medusa run seed
yarn --cwd apps/medusa run add-user
yarn --cwd apps/medusa run get-key
yarn --cwd apps/medusa medusa exec ./src/scripts/fix-seller-links.ts
yarn --cwd apps/medusa medusa exec ./src/scripts/verify-seller-links.ts
```
Expected verification result includes `missing_count: 0`.

## 3) Configure Stripe webhook for deployed Medusa
1. In Stripe Dashboard, add endpoint:
- `https://<your-render-medusa-domain>/hooks/payment/stripe_stripe`
2. Subscribe to events:
- `payment_intent.amount_capturable_updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.partially_funded`
3. Copy webhook signing secret and set:
- `STRIPE_WEBHOOK_SECRET` in Render env.
4. Redeploy Medusa service.

## 4) Deploy storefront on Vercel
1. Create new Vercel project from same repo.
2. Monorepo settings (recommended):
- Root Directory: `apps/storefront`
- Framework: `React Router` (or Other if not detected)
- Build Command: `yarn build`
- Install Command: `corepack enable && yarn install --immutable`
3. Add Vercel environment variables:
- `MEDUSA_PUBLISHABLE_KEY=<pk_... from get-key>`
- `PUBLIC_MEDUSA_API_URL=https://<your-render-medusa-domain>`
- `INTERNAL_MEDUSA_API_URL=https://<your-render-medusa-domain>`
- `MEDUSA_BACKEND_URL=https://<your-render-medusa-domain>`
- `STRIPE_PUBLIC_KEY=<pk_test_or_live>`
- `STRIPE_SECRET_KEY=<sk_test_or_live>`
4. Deploy.
5. If Vercel domain changes or custom domain is added, update Render:
- `STORE_CORS`
- `AUTH_CORS`
Then redeploy Medusa.

## 5) ServiceNow Integration Hub setup
1. Create Connection Alias: `Medusa Store API`
- Base URL: `https://<your-render-medusa-domain>`
- Default Header: `x-publishable-api-key: <pk_...>`
2. Create Connection Alias: `Stripe API`
- Base URL: `https://api.stripe.com`
- Auth: Bearer token with Stripe secret key.
3. Build REST steps/actions for:
- Medusa catalog and seller data:
  - `GET /store/marketplace/products`
  - `GET /store/sellers`
  - `GET /store/sellers/{handle}`
- Stripe payment/dispute objects from Stripe API as needed.
4. Keep Medusa write/admin actions out of public store endpoints.
- If you need privileged order/admin data, create dedicated protected integration endpoints first.

---

## Validation / Smoke Tests
1. Medusa health:
- `GET https://<medusa>/health` returns `OK`.
2. Medusa marketplace:
- `GET /store/marketplace/products?handle=men-slim-chino-pants&limit=1`
- `seller` must be non-null.
3. Seller pages:
- `GET /store/marketplace/products?seller_handle=pacific-studio` returns non-empty.
4. Storefront:
- PDP shows seller card with real seller, no “Seller unavailable”.
- Currency switch works USD/PHP.
- Checkout works with Stripe test card.
5. ServiceNow:
- Test Medusa alias request succeeds with publishable key header.
- Test Stripe alias request succeeds with bearer token.

---

## Assumptions and Defaults
- Deploy target is **single environment first** (production-like test).
- Medusa runs only in server mode on Render for now.
- ServiceNow initially consumes Medusa **store endpoints** and Stripe APIs only.
- Stripe stays in **test mode** until you explicitly switch to live keys/webhooks.
- No automated IaC yet (manual UI setup first, IaC later with `render.yaml` and Vercel project config).

