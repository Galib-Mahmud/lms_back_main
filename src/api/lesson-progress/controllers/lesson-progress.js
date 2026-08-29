'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { isStudent, canManageAllCourses } = require('../../../utils/access');

module.exports = createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const { filters } = ctx.query || {};
    let filterLessonId = null;
    if (filters && filters.lesson && filters.lesson.id) {
      filterLessonId = Number(filters.lesson.id);
    }

    let records = [];
    if (isStudent(user)) {
      const whereClause = { user: user.id };
      if (filterLessonId) whereClause.lesson = filterLessonId;
      records = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
        where: whereClause,
        populate: ['lesson', 'course'],
      });
    } else if (canManageAllCourses(user)) {
      const whereClause = filterLessonId ? { lesson: filterLessonId } : {};
      records = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
        where: whereClause,
        populate: ['lesson', 'course', 'user'],
      });
    } else {
      const ownedCourses = await strapi.db.query('api::course.course').findMany({
        where: { owner: user.id },
        select: ['id'],
      });
      const ownedIds = ownedCourses.map((c) => c.id);
      const whereClause = { course: { id: { $in: ownedIds } } };
      if (filterLessonId) whereClause.lesson = filterLessonId;
      records = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
        where: whereClause,
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
