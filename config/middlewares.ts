import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  // Allow the admin panel to load media (images/videos) served from R2's CDN.
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            process.env.R2_PUBLIC_URL,
            process.env.R2_ENDPOINT,
          ].filter(Boolean),
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            process.env.R2_PUBLIC_URL,
            process.env.R2_ENDPOINT,
          ].filter(Boolean),
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
