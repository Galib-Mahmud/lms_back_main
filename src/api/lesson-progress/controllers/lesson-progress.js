'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { isStudent, canManageAllCourses } = require('../../../utils/access');

module.exports = createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    let records = [];
    if (isStudent(user)) {
      records = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
        where: { user: user.id },
        populate: ['lesson', 'course'],
      });
    } else if (canManageAllCourses(user)) {
      records = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
        populate: ['lesson', 'course', 'user'],
      });
    } else {
      const ownedCourses = await strapi.db.query('api::course.course').findMany({
        where: { owner: user.id },
        select: ['id'],
      });
      const ownedIds = ownedCourses.map((c) => c.id);
      records = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
        where: { course: { id: { $in: ownedIds } } },
        populate: ['lesson', 'course', 'user'],
      });
    }

    return { data: records };
  },

  async create(ctx) {
    return ctx.forbidden('Use POST /api/lessons/:id/complete instead.');
  },
  async update(ctx) {
    return ctx.forbidden('Use POST /api/lessons/:id/complete instead.');
  },
}));
