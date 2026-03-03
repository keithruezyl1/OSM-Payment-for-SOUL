# How to Get Started

Welcome to the Medusa 2 Starter project! This guide will help you get your local development environment up and running after cloning the repository.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js 20+**
- **Yarn 4.5.0** (Check via `yarn --version`)
- **Docker & Docker Compose** (Required for the database)

---

## 🚀 Quick Start Setup

Follow these steps in order to set up the project:

### 1. Install Dependencies
Run the following command at the root of the project:
```bash
yarn
```

### 2. Generate Environment Files
We have a helper script to create the necessary `.env` files for both the backend and frontend:
```bash
yarn run generate-env
```
This copies the templates to `apps/medusa/.env` and `apps/storefront/.env`.

### 3. Configure Credentials & Stripe
Open the `credentials.md` file in the root directory. This file contains pre-configured test credentials which you need to copy into your `.env` files.

#### apps/medusa/.env
- Set `STRIPE_API_KEY` to the value of **stripe api key** (starts with `sk_test_...`) from `credentials.md`.

#### apps/storefront/.env
- Set `STRIPE_PUBLIC_KEY` to the value of **stripe publishable api key** (starts with `pk_...`) from `credentials.md`.
- Set `STRIPE_SECRET_KEY` to the value of **stripe api key** (starts with `sk_test_...`) from `credentials.md`.

> [!TIP]
> **Windows/WSL Users:** If you experience `ECONNREFUSED` or connection timeouts, change any `localhost` references in your `.env` files to `127.0.0.1`.

> [!NOTE]
> The `credentials.md` file also contains a test credit card number (4242...) that you can use for testing checkouts in the storefront.

### 4. Initialize the Database
Ensure Docker is running, then run:
```bash
yarn run medusa:init
```

> [!IMPORTANT]
> **Port Conflicts:** If you see "password authentication failed" even with the correct password, search for `POSTGRES_URL` in `apps/medusa/.env` and ensure it's not conflicting with a local Postgres installation on port 5432. The default for this project is port **5433**.

This command will:
- Start the PostgreSQL database via Docker.
- Run migrations.
- Seed the database with initial products and an admin user.

### 5. Start Development Servers
Start both the Medusa backend and the Remix storefront:
```bash
yarn dev
```

---

## 🔑 Accessing the Admin Dashboard

- **URL:** [http://localhost:9000/app](http://localhost:9000/app)
- **Email:** `admin@medusa-test.com` (from `credentials.md`)
- **Password:** `supersecret` (from `credentials.md`)

### Finalizing Storefront Configuration
To enable the storefront to talk to the backend, you MUST have a valid Publishable API Key:
1. Log in to the Admin Dashboard.
2. Go to **Settings > Publishable API Keys**.
3. Create a key named **"Storefront"**.
4. Paste this key into `apps/storefront/.env` as `MEDUSA_PUBLISHABLE_KEY`.
5. **Restart the servers** using `yarn dev` for the new key to be recognized.

---

## 🛠️ Common Commands

- `yarn dev`: Start all apps in development mode.
- `yarn build`: Build all apps for production.
- `yarn run medusa:init`: Reset and re-seed the database.
- `yarn lint`: Run linting across the monorepo.

---

## 🛠️ Troubleshooting & Common Issues

### 1. Storefront is blank or shows "Fetch Failed"
- Double check that `MEDUSA_PUBLISHABLE_KEY` is set correctly in `apps/storefront/.env`.
- Ensure `STORE_CORS` in `apps/medusa/.env` includes `http://localhost:3000`.
- Try using `http://127.0.0.1:9000` as the backend URL instead of `localhost`.

### 2. Database connection fails (PostgreSQL)

#### Windows Service Errors
If the `postgresql-x64` service "starts and then stops" in `services.msc`:
- Ensure no other Postgres version is running on port 5432.
- Check `C:\Program Files\PostgreSQL\18\data\postmaster.pid` and delete it if it exists.
- Ensure the **NETWORK SERVICE** account has **Full Control** permissions over the `data` folder.

#### Password Authentication Failed
- Test your password in the terminal: `psql -U postgres -d postgres`
- Update your password in `apps/medusa/.env` inside the `DATABASE_URL` string.
- If you forgot your password, you may need to reinstall PostgreSQL or use `ALTER USER postgres WITH PASSWORD 'new_password';` from a superuser terminal.

#### Manual DB Creation
If `medusa:init` fails to create the database:
```bash
# Run this from any terminal
createdb -U postgres medusa2
```

### 3. Redis Connection Errors (ECONNREFUSED 6379)
If you don't have Redis installed locally, you must disable the Redis requirement in Medusa:
1. In `apps/medusa/.env`, comment out the Redis line: `# REDIS_URL=redis://localhost:6379`
2. Ensure `medusa-config.ts` has the fallback logic implemented:
   ```typescript
   const cacheModule = (IS_TEST || !REDIS_URL) ? { resolve: '@medusajs/medusa/cache-inmemory' } : ...
   ```

### 4. Plugin Resolution Errors (ERR_PACKAGE_PATH_NOT_EXPORTED)
If a plugin (like `medusa-product-reviews`) fails to start with an export error:
- Check the plugin's `package.json` in `node_modules`.
- Ensure it has a root export defined in the `exports` object:
  ```json
  "exports": {
    ".": "./.medusa/server/src/modules/product-review/index.js",
    ...
  }
  ```

### 5. Command not recognized
- Ensure PostgreSQL's `bin` folder (e.g., `C:\Program Files\PostgreSQL\18\bin`) is added to your **System PATH**.
- Open a **new** terminal window after updating environment variables.

---

## 📑 Explaining `credentials.md`

The `credentials.md` file is a central place for shared development secrets. 

| Key | Description |
| :--- | :--- |
| `email` / `password` | The default login for the Medusa Admin panel. |
| `stripe publishable api key` | Used in the storefront to initialize Stripe Elements. |
| `stripe api key` | The secret key used by the backend to process payments. |
| `stripe webhook secret` | Used to verify incoming events from Stripe. |
| `card` / `expiry` / `CVV` | Test card details for completing orders in development. |

---

Happy Coding! 🚀
