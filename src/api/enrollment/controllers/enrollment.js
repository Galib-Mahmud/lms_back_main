'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { isStudent, canManageAllCourses, canManageCourse } = require('../../../utils/access');

module.exports = createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  // Direct creation is only used as a fallback; the primary enrollment flow is
  // POST /api/courses/:id/enroll on the course controller.
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

    if (isStudent(user)) {
      ctx.query.filters = { ...(ctx.query.filters || {}), user: user.id };
      return super.find(ctx);
    }

    if (canManageAllCourses(user)) {
      return super.find(ctx);
    }

    // Instructor: only enrollments for courses they own.
    const ownedCourses = await strapi.db.query('api::course.course').findMany({
      where: { owner: user.id },
      select: ['id'],
    });
    ctx.query.filters = {
      ...(ctx.query.filters || {}),
      course: { id: { $in: ownedCourses.map((c) => c.id) } },
    };
    return super.find(ctx);
  },
}));
