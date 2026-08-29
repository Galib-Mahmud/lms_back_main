'use strict';

const syncRolesAndPermissions = require('./bootstrap-roles');
const seedDemoData = require('./bootstrap-seed');

module.exports = {
  register(/* { strapi } */) {},

  async bootstrap({ strapi }) {
    await syncRolesAndPermissions({ strapi });
    await seedDemoData({ strapi });
  },
};
