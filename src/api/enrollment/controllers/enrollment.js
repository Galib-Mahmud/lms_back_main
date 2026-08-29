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

    let enrollments = [];
    if (isStudent(user)) {
      enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { user: user.id },
        populate: ['course'],
      });
    } else if (canManageAllCourses(user)) {
      enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        populate: ['course', 'user'],
      });
    } else {
      const ownedCourses = await strapi.db.query('api::course.course').findMany({
        where: { owner: user.id },
        select: ['id'],
      });
      const ownedIds = ownedCourses.map((c) => c.id);
      enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { course: { id: { $in: ownedIds } } },
        populate: ['course', 'user'],
      });
    }

    return { data: enrollments };
  },
}));
