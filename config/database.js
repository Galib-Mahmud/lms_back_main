const path = require('path');

module.exports = ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  // Automatically detect Railway, Render, Heroku or standard PostgreSQL credentials
  const dbUrl = env('DATABASE_URL') || env('POSTGRES_URL');
  const dbHost = env('DATABASE_HOST') || env('PGHOST') || env('POSTGRES_HOST') || '127.0.0.1';
  const dbPort = env.int('DATABASE_PORT', env.int('PGPORT', 5432));
  const dbName = env('DATABASE_NAME') || env('PGDATABASE') || env('POSTGRES_DATABASE') || 'strapi';
  const dbUser = env('DATABASE_USERNAME') || env('PGUSER') || env('POSTGRES_USER') || 'strapi';
  const dbPass = env('DATABASE_PASSWORD') || env('PGPASSWORD') || env('POSTGRES_PASSWORD') || '';

  const postgresConnection = dbUrl
    ? {
        connectionString: dbUrl,
        ssl: env.bool('DATABASE_SSL', true) ? { rejectUnauthorized: false } : false,
      }
    : {
        host: dbHost,
        port: dbPort,
        database: dbName,
        user: dbUser,
        password: dbPass,
        ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
        schema: env('DATABASE_SCHEMA', 'public'),
      };

  const connections = {
    postgres: {
      connection: postgresConnection,
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
