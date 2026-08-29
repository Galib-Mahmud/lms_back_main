'use strict';

const { createStrapi } = require('@strapi/strapi');

async function run() {
  const strapi = await createStrapi().load();
  const courses = await strapi.db.query('api::course.course').findMany();
  console.log('Existing courses count:', courses.length);
  console.log('Courses:', JSON.stringify(courses, null, 2));
  const users = await strapi.db.query('plugin::users-permissions.user').findMany({ populate: ['role'] });
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role?.type })));
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
