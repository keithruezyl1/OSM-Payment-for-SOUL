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

> [!NOTE]
> The `credentials.md` file also contains a test credit card number (4242...) that you can use for testing checkouts in the storefront.

### 4. Initialize the Database
Ensure Docker is running, then run:
```bash
yarn run medusa:init
```
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
To enable the storefront to talk to the backend, you need a Publishable API Key:
1. Log in to the Admin Dashboard.
2. Go to **Settings > Publishable API Keys**.
3. Copy an existing key or create a new one.
4. Paste this key into `apps/storefront/.env` as `MEDUSA_PUBLISHABLE_KEY`.
5. Restart the servers using `yarn dev`.

---

## 🛠️ Common Commands

- `yarn dev`: Start all apps in development mode.
- `yarn build`: Build all apps for production.
- `yarn run medusa:init`: Reset and re-seed the database.
- `yarn lint`: Run linting across the monorepo.

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
