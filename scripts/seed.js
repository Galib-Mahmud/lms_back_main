'use strict';

const { createStrapi } = require('@strapi/strapi');

async function run() {
  const strapi = await createStrapi().load();
  const seedDemoData = require('../src/bootstrap-seed');
  await seedDemoData({ strapi });
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
