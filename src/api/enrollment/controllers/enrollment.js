'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { isStudent, canManageAllCourses } = require('../../../utils/access');

module.exports = createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');
    if (!isStudent(user)) return ctx.forbidden('Only students can enroll in courses.');

    ctx.request.body.data = ctx.request.body.data || {};
    ctx.request.body.data.user = user.id;
    ctx.request.body.data.enrolledAt = new Date();

    return super.create(ctx);
  },

  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const { filters } = ctx.query || {};
    let filterCourseId = null;
    if (filters && filters.course && filters.course.id) {
      filterCourseId = Number(filters.course.id);
    }

    let enrollments = [];
    if (isStudent(user)) {
      const whereClause = { user: user.id };
      if (filterCourseId) whereClause.course = filterCourseId;
      enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: whereClause,
        populate: ['course'],
      });
    } else if (canManageAllCourses(user)) {
      const whereClause = filterCourseId ? { course: filterCourseId } : {};
      enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: whereClause,
        populate: ['course', 'user'],
      });
    } else {
      const ownedCourses = await strapi.db.query('api::course.course').findMany({
        where: { owner: user.id },
        select: ['id'],
      });
      const ownedIds = ownedCourses.map((c) => c.id);
      let targetCourseIds = ownedIds;
      if (filterCourseId) {
        targetCourseIds = ownedIds.includes(filterCourseId) ? [filterCourseId] : [];
      }
      enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { course: { id: { $in: targetCourseIds } } },
        populate: ['course', 'user'],
      });
    }

    return { data: enrollments };
  },
}));
