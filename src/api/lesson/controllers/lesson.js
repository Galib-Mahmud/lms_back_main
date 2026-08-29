'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { canManageCourse, isStudent } = require('../../../utils/access');

// lessonDocumentId is the lesson's documentId (Strapi 5 route :id param).
const getCourseForLesson = async (strapi, lessonDocumentId) => {
  const lesson = await strapi.db.query('api::lesson.lesson').findOne({
    where: { documentId: lessonDocumentId },
    populate: { course: { populate: ['owner'] } },
  });
  return lesson;
};

const studentCanViewCourse = async (strapi, userId, courseIdentifier) => {
  let targetCourseId = courseIdentifier;
  if (typeof courseIdentifier === 'string' && isNaN(Number(courseIdentifier))) {
    const course = await strapi.db.query('api::course.course').findOne({
      where: { documentId: courseIdentifier },
    });
    if (!course) return false;
    targetCourseId = course.id;
  } else {
    targetCourseId = Number(courseIdentifier);
  }

  const enrolled = await strapi.db.query('api::enrollment.enrollment').findOne({
    where: { user: userId, course: targetCourseId },
  });
  return !!enrolled;
};

module.exports = createCoreController('api::lesson.lesson', ({ strapi }) => ({
  // Students only ever see lessons for courses they're enrolled in.
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    if (isStudent(user)) {
      const courseFilter = ctx.query.filters?.course;
      let courseId = typeof courseFilter === 'object'
        ? (courseFilter?.id ?? courseFilter?.documentId ?? courseFilter?.$eq)
        : courseFilter;

      if (!courseId) {
        return ctx.badRequest('A course filter is required, e.g. ?filters[course][id]=1');
      }
      const allowed = await studentCanViewCourse(strapi, user.id, courseId);
      if (!allowed) return ctx.forbidden('You are not enrolled in this course.');
    }

    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const lesson = await getCourseForLesson(strapi, ctx.params.id);
    if (!lesson) return ctx.notFound('Lesson not found.');

    if (isStudent(user)) {
      const allowed = await studentCanViewCourse(strapi, user.id, lesson.course.id);
      if (!allowed) return ctx.forbidden('You are not enrolled in this course.');
    }

    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;
    const courseDocumentId = ctx.request.body?.data?.course;
    if (!user || !courseDocumentId) return ctx.badRequest('A course id is required.');

    const course = await strapi.db.query('api::course.course').findOne({
      where: { documentId: courseDocumentId },
      populate: ['owner'],
    });
    if (!course) return ctx.notFound('Course not found.');
    if (!canManageCourse(user, course)) {
      return ctx.forbidden('You do not have permission to add lessons to this course.');
    }

    return super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    const lesson = await getCourseForLesson(strapi, ctx.params.id);
    if (!lesson) return ctx.notFound('Lesson not found.');
    if (!canManageCourse(user, lesson.course)) {
      return ctx.forbidden('You do not have permission to edit this lesson.');
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const lesson = await getCourseForLesson(strapi, ctx.params.id);
    if (!lesson) return ctx.notFound('Lesson not found.');
    if (!canManageCourse(user, lesson.course)) {
      return ctx.forbidden('You do not have permission to delete this lesson.');
    }
    return super.delete(ctx);
  },

  // POST /api/lessons/:id/complete  (student only, must be enrolled in the parent course)
  async complete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');
    if (!isStudent(user)) return ctx.forbidden('Only students can mark lessons complete.');

    const lesson = await getCourseForLesson(strapi, ctx.params.id);
    if (!lesson) return ctx.notFound('Lesson not found.');

    const enrolled = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: { user: user.id, course: lesson.course.id },
    });
    if (!enrolled) return ctx.forbidden('You must be enrolled in this course first.');

    const existing = await strapi.db.query('api::lesson-progress.lesson-progress').findOne({
      where: { user: user.id, lesson: lesson.id },
    });

    let record;
    if (existing) {
      record = await strapi.db.query('api::lesson-progress.lesson-progress').update({
        where: { id: existing.id },
        data: { completed: true, completedAt: new Date() },
      });
    } else {
      record = await strapi.db.query('api::lesson-progress.lesson-progress').create({
        data: {
          user: user.id,
          lesson: lesson.id,
          course: lesson.course.id,
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    ctx.body = { data: record };
  },
}));
