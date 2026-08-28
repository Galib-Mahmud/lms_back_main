'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { isStudent, canManageAllCourses } = require('../../../utils/access');

module.exports = createCoreController('api::quiz-result.quiz-result', ({ strapi }) => ({
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

  // Writes only ever happen via the quiz.submit custom action.
  async create(ctx) {
    return ctx.forbidden('Use POST /api/quizzes/:id/submit instead.');
  },
  async update(ctx) {
    return ctx.forbidden('Direct edits to quiz results are not allowed.');
  },
}));
