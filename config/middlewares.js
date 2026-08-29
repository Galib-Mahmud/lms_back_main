module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (ctx) => {
        const reqOrigin = ctx.request.header.origin;
        if (!reqOrigin) return '*';
        if (
          reqOrigin.includes('vercel.app') ||
          reqOrigin.includes('localhost') ||
          reqOrigin.includes('127.0.0.1')
        ) {
          return reqOrigin;
        }
        if (process.env.CORS_ORIGINS) {
          const allowed = process.env.CORS_ORIGINS.split(',').map((s) =>
            s.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '')
          );
          if (allowed.includes(reqOrigin.replace(/\/$/, ''))) return reqOrigin;
        }
        return reqOrigin;
      },
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
