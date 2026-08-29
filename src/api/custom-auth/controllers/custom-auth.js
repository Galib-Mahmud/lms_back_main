'use strict';

const bcrypt = require('bcryptjs');

const SELF_SERVICE_ROLES = ['student', 'instructor'];

module.exports = {
  // GET /api/custom-auth/me
  async me(ctx) {
    try {
      const authHeader = ctx.request.header.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ctx.unauthorized('No authorization header provided.');
      }
      const token = authHeader.substring(7);
      const payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
      if (!payload || !payload.id) {
        return ctx.unauthorized('Invalid token.');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: payload.id },
        populate: ['role'],
      });

      if (!user) return ctx.notFound('User not found.');

      ctx.body = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username,
        role: {
          type: user.role?.type || 'student',
          name: user.role?.name || 'Student',
        },
      };
    } catch (err) {
      return ctx.unauthorized('Invalid or expired token.');
    }
  },

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

      const cleanEmail = email.toLowerCase().trim();
      const cleanUsername = username.trim();

      const existingEmail = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: cleanEmail },
      });
      if (existingEmail) return ctx.badRequest('Email is already taken.');

      const existingUsername = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { username: cleanUsername },
      });
      if (existingUsername) return ctx.badRequest('Username is already taken.');

      const role = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: requestedRole },
      });
      if (!role) {
        return ctx.badRequest('Required role does not exist on this server.');
      }

      // Hash password using bcrypt so /api/auth/local matches perfectly
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await strapi.db.query('plugin::users-permissions.user').create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          password: hashedPassword,
          fullName: fullName ? fullName.trim() : cleanUsername,
          provider: 'local',
          confirmed: true,
          blocked: false,
          role: role.id,
        },
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
