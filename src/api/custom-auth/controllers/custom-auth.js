'use strict';

const SELF_SERVICE_ROLES = ['student', 'instructor'];

module.exports = {
  // POST /api/custom-auth/register
  // Body: { username, email, password, fullName?, roleType?: 'student' | 'instructor' }
  // Admin and Content Manager accounts can only ever be created/promoted by an existing
  // admin via PUT /api/admin-users/:id/role — never through public signup.
  async register(ctx) {
    const { username, email, password, fullName, roleType } = ctx.request.body || {};

    if (!username || !email || !password) {
      return ctx.badRequest('username, email and password are required.');
    }
    if (password.length < 6) {
      return ctx.badRequest('Password must be at least 6 characters.');
    }

    const requestedRole = SELF_SERVICE_ROLES.includes(roleType) ? roleType : 'student';

    const existingEmail = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) return ctx.badRequest('Email is already taken.');

    const existingUsername = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { username },
    });
    if (existingUsername) return ctx.badRequest('Username is already taken.');

    const role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: requestedRole },
    });
    if (!role) {
      return ctx.badRequest(
        'Roles have not finished initializing on this server yet. Please try again in a moment.'
      );
    }

    // Password hashing happens automatically via the users-permissions plugin's
    // own beforeCreate lifecycle on this model, since we're using the same query layer.
    const user = await strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username,
        email: email.toLowerCase(),
        password,
        fullName: fullName || username,
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: role.id,
      },
      populate: ['role'],
    });

    const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

    ctx.body = {
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: { type: user.role.type, name: user.role.name },
      },
    };
  },
};
