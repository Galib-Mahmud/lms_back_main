'use strict';

const { createStrapi } = require('@strapi/strapi');

async function run() {
  const strapi = await createStrapi().load();
  console.log('[reset-and-seed] Cleaning existing content...');
  
  await strapi.db.query('api::lesson-progress.lesson-progress').deleteMany({});
  await strapi.db.query('api::enrollment.enrollment').deleteMany({});
  await strapi.db.query('api::quiz.quiz').deleteMany({});
  await strapi.db.query('api::lesson.lesson').deleteMany({});
  await strapi.db.query('api::course.course').deleteMany({});
  await strapi.db.query('api::blog-post.blog-post').deleteMany({});

  console.log('[reset-and-seed] Running seeder...');
  const seedDemoData = require('../src/bootstrap-seed');
  await seedDemoData({ strapi });

  console.log('[reset-and-seed] Seed complete!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
