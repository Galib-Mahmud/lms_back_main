'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { isStudent, canManageAllCourses } = require('../../../utils/access');

module.exports = createCoreController('api::quiz-result.quiz-result', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    let records = [];
    if (isStudent(user)) {
      records = await strapi.db.query('api::quiz-result.quiz-result').findMany({
        where: { user: user.id },
        populate: ['quiz', 'course'],
      });
    } else if (canManageAllCourses(user)) {
      records = await strapi.db.query('api::quiz-result.quiz-result').findMany({
        populate: ['quiz', 'course', 'user'],
      });
    } else {
      const ownedCourses = await strapi.db.query('api::course.course').findMany({
        where: { owner: user.id },
        select: ['id'],
      });
      const ownedIds = ownedCourses.map((c) => c.id);
      records = await strapi.db.query('api::quiz-result.quiz-result').findMany({
        where: { course: { id: { $in: ownedIds } } },
        populate: ['quiz', 'course', 'user'],
      });
    }

    return { data: records };
  },

  async create(ctx) {
    return ctx.forbidden('Use POST /api/quizzes/:id/submit instead.');
  },
  async update(ctx) {
    return ctx.forbidden('Direct edits to quiz results are not allowed.');
  },
}));
