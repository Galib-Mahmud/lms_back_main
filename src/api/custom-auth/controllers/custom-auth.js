'use strict';

const SELF_SERVICE_ROLES = ['student', 'instructor'];

module.exports = {
  // POST /api/custom-auth/register
  // Body: { username, email, password, fullName?, roleType?: 'student' | 'instructor' }
  async register(ctx) {
    try {
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
        return ctx.badRequest('Required role does not exist on this server.');
      }

      // Use official users-permissions service to create user cleanly
      const newUser = await strapi.plugin('users-permissions').service('user').add({
        username,
        email: email.toLowerCase(),
        password,
        fullName: fullName || username,
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: role.id,
      });

      const userWithRole = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: newUser.id },
        populate: ['role'],
      });

      const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: userWithRole.id });

      ctx.body = {
        jwt,
        user: {
          id: userWithRole.id,
          username: userWithRole.username,
          email: userWithRole.email,
          fullName: userWithRole.fullName,
          role: { type: userWithRole.role?.type || requestedRole, name: userWithRole.role?.name || requestedRole },
        },
      };
    } catch (err) {
      strapi.log.error('Register error:', err);
      return ctx.badRequest(err.message || 'Registration failed.');
    }
  },
};
