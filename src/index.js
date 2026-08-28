'use strict';

const syncRolesAndPermissions = require('./bootstrap-roles');

module.exports = {
  register(/* { strapi } */) {},

  async bootstrap({ strapi }) {
    await syncRolesAndPermissions({ strapi });
  },
};
