import { defineConfig, loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

const REDIS_URL = process.env.REDIS_URL;
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const IS_TEST = process.env.NODE_ENV === 'test';
const DISABLE_MEDUSA_ADMIN = process.env.DISABLE_MEDUSA_ADMIN === 'true';
const ENABLE_PRODUCT_REVIEWS = process.env.ENABLE_PRODUCT_REVIEWS === 'true';
const DATABASE_URL = process.env.DATABASE_URL || '';
const USE_DB_SSL =
  process.env.DB_SSL === 'true' ||
  process.env.NODE_ENV === 'production' ||
  DATABASE_URL.includes('sslmode=require');

const cacheModule = (IS_TEST || !REDIS_URL)
  ? { resolve: '@medusajs/medusa/cache-inmemory' }
  : {
      resolve: '@medusajs/medusa/cache-redis',
      options: {
        redisUrl: REDIS_URL,
      },
    };

const eventBusModule = (IS_TEST || !REDIS_URL)
  ? { resolve: '@medusajs/medusa/event-bus-local' }
  : {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: {
        redisUrl: REDIS_URL,
      },
    };

const workflowEngineModule = (IS_TEST || !REDIS_URL)
  ? { resolve: '@medusajs/medusa/workflow-engine-inmemory' }
  : {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: {
        redis: {
          url: REDIS_URL,
        },
      },
    };

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseDriverOptions: USE_DB_SSL
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {
          ssl: false,
        },
    redisUrl: REDIS_URL,

    redisPrefix: process.env.REDIS_PREFIX,
    http: {
      storeCors: process.env.STORE_CORS || '',
      adminCors: process.env.ADMIN_CORS || '',
      authCors: process.env.AUTH_CORS || '',
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  plugins: ENABLE_PRODUCT_REVIEWS
    ? [
        {
          resolve: '@lambdacurry/medusa-product-reviews',
          options: {},
        },
      ]
    : [],
  modules: [
    {
      resolve: "./src/modules/seller",
      options: {},
      definition: { isQueryable: true },
    },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    cacheModule,
    eventBusModule,
    workflowEngineModule,
  ],
  admin: {
    disable: DISABLE_MEDUSA_ADMIN,
    backendUrl: process.env.ADMIN_BACKEND_URL,
    vite: (config) => {
      return {
        resolve: {
          alias: {
            '@lambdacurrymedusa-product-reviewsadmin': '@lambdacurry/medusa-product-reviews/admin'
          }
        },
        optimizeDeps: {
          include: ['@lambdacurry/medusa-plugins-sdk'],
        },
      };
    },
  },
});


