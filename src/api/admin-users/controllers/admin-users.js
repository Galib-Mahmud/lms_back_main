'use strict';

const ALLOWED_ROLE_TYPES = ['admin', 'content_manager', 'instructor', 'student'];

module.exports = {
  // GET /api/admin-users
  async find(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.forbidden('Admins only.');

    const users = await strapi.db.query('plugin::users-permissions.user').findMany({
      populate: ['role'],
      orderBy: { createdAt: 'desc' },
    });

    ctx.body = {
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        blocked: u.blocked,
        role: u.role ? { id: u.role.id, type: u.role.type, name: u.role.name } : null,
        createdAt: u.createdAt,
      })),
    };
  },

  // PUT /api/admin-users/:id/role   { roleType: 'instructor' }
  async changeRole(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.forbidden('Admins only.');

    const { id } = ctx.params;
    const { roleType } = ctx.request.body || {};

    if (!ALLOWED_ROLE_TYPES.includes(roleType)) {
      return ctx.badRequest(`roleType must be one of: ${ALLOWED_ROLE_TYPES.join(', ')}`);
    }

    const role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: roleType },
    });
    if (!role) return ctx.badRequest('That role does not exist yet on this server.');

    const updated = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id },
      data: { role: role.id },
      populate: ['role'],
    });

    ctx.body = { data: { id: updated.id, role: { type: role.type, name: role.name } } };
  },
};
