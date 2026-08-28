// 'use strict';

// const { createCoreController } = require('@strapi/strapi').factories;
// const { canManageAllCourses, canManageCourse, isStudent } = require('../../../utils/access');

// module.exports = createCoreController('api::course.course', ({ strapi }) => ({
//   // Anyone with a privileged role can create; instructors are auto-set as owner.
//   async create(ctx) {
//     const user = ctx.state.user;
//     if (!user) return ctx.unauthorized('You must be logged in.');

//     const role = user.role?.type;
//     if (!['admin', 'content_manager', 'instructor'].includes(role)) {
//       return ctx.forbidden('Your role cannot create courses.');
//     }

//     ctx.request.body.data = ctx.request.body.data || {};
//     // Instructors can only ever create courses owned by themselves.
//     if (role === 'instructor') {
//       ctx.request.body.data.owner = user.id;
//     } else if (!ctx.request.body.data.owner) {
//       ctx.request.body.data.owner = user.id;
//     }

//     const response = await super.create(ctx);
//     return response;
//   },

//   async update(ctx) {
//     const user = ctx.state.user;
//     const { id } = ctx.params;
//     const course = await strapi.db.query('api::course.course').findOne({
//       where: { id },
//       populate: ['owner'],
//     });

//     if (!course) return ctx.notFound('Course not found.');
//     if (!canManageCourse(user, course)) {
//       return ctx.forbidden('You do not have permission to edit this course.');
//     }

//     // Instructors may never reassign ownership.
//     if (user.role?.type === 'instructor' && ctx.request.body?.data) {
//       delete ctx.request.body.data.owner;
//     }

//     return super.update(ctx);
//   },

//   async delete(ctx) {
//     const user = ctx.state.user;
//     const { id } = ctx.params;
//     const course = await strapi.db.query('api::course.course').findOne({
//       where: { id },
//       populate: ['owner'],
//     });

//     if (!course) return ctx.notFound('Course not found.');
//     if (!canManageCourse(user, course)) {
//       return ctx.forbidden('You do not have permission to delete this course.');
//     }

//     return super.delete(ctx);
//   },

//   // POST /api/courses/:id/enroll  (student only)
//   async enroll(ctx) {
//     const user = ctx.state.user;
//     if (!user) return ctx.unauthorized('You must be logged in.');
//     if (!isStudent(user)) return ctx.forbidden('Only students can enroll in courses.');

//     const { id } = ctx.params;
//     const course = await strapi.db.query('api::course.course').findOne({ where: { id } });
//     if (!course) return ctx.notFound('Course not found.');

//     const existing = await strapi.db.query('api::enrollment.enrollment').findOne({
//       where: { user: user.id, course: id },
//     });
//     if (existing) {
//       return ctx.badRequest('You are already enrolled in this course.');
//     }

//     const enrollment = await strapi.db.query('api::enrollment.enrollment').create({
//       data: { user: user.id, course: id, enrolledAt: new Date() },
//     });

//     ctx.body = { data: enrollment };
//   },

//   // GET /api/courses/:id/progress  -> percentage complete for the current student
//   // Privileged roles may pass ?studentId=X to inspect a specific student's progress,
//   // subject to the same course-ownership rules as editing.
//   async progress(ctx) {
//     const user = ctx.state.user;
//     if (!user) return ctx.unauthorized('You must be logged in.');

//     const { id: courseId } = ctx.params;
//     const { studentId } = ctx.query;

//     const course = await strapi.db.query('api::course.course').findOne({
//       where: { id: courseId },
//       populate: ['owner'],
//     });
//     if (!course) return ctx.notFound('Course not found.');

//     let targetUserId = user.id;

//     if (studentId && Number(studentId) !== user.id) {
//       if (!canManageCourse(user, course)) {
//         return ctx.forbidden('You cannot view another student\'s progress for this course.');
//       }
//       targetUserId = Number(studentId);
//     } else if (isStudent(user)) {
//       const enrolled = await strapi.db.query('api::enrollment.enrollment').findOne({
//         where: { user: user.id, course: courseId },
//       });
//       if (!enrolled) return ctx.forbidden('You are not enrolled in this course.');
//     }

//     const totalLessons = await strapi.db.query('api::lesson.lesson').count({
//       where: { course: courseId },
//     });

//     const completedLessons = await strapi.db.query('api::lesson-progress.lesson-progress').count({
//       where: { course: courseId, user: targetUserId, completed: true },
//     });

//     const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

//     ctx.body = {
//       data: {
//         courseId: Number(courseId),
//         studentId: targetUserId,
//         totalLessons,
//         completedLessons,
//         percentage,
//       },
//     };
//   },
// }));















'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { canManageAllCourses, canManageCourse, isStudent } = require('../../../utils/access');

// Strapi 5 note: the default REST routes (findOne/update/delete) and any relation
// value passed through the core create/update actions use the entity's documentId
// (a string), not its numeric database id. Our own raw db.query() calls (used for
// permission pre-checks and for writing to enrollment/lesson-progress/quiz-result)
// still work with the numeric id, since that's what's actually stored in the
// foreign-key columns. So the pattern throughout this file is: look the entity up
// by documentId first, then use the resulting numeric `.id` for everything else.
const findCourseByDocumentId = (strapi, documentId) =>
  strapi.db.query('api::course.course').findOne({
    where: { documentId },
    populate: ['owner'],
  });

module.exports = createCoreController('api::course.course', ({ strapi }) => ({
  // Anyone with a privileged role can create; instructors are auto-set as owner.
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const role = user.role?.type;
    if (!['admin', 'content_manager', 'instructor'].includes(role)) {
      return ctx.forbidden('Your role cannot create courses.');
    }

    // Relation values for the core create action must be documentIds, not
    // numeric ids, so we look up the current user's documentId explicitly.
    const dbUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
    });

    ctx.request.body.data = ctx.request.body.data || {};
    if (role === 'instructor') {
      ctx.request.body.data.owner = dbUser.documentId;
    } else if (!ctx.request.body.data.owner) {
      ctx.request.body.data.owner = dbUser.documentId;
    }

    const response = await super.create(ctx);
    return response;
  },

  async update(ctx) {
    const user = ctx.state.user;
    const course = await findCourseByDocumentId(strapi, ctx.params.id);

    if (!course) return ctx.notFound('Course not found.');
    if (!canManageCourse(user, course)) {
      return ctx.forbidden('You do not have permission to edit this course.');
    }

    // Instructors may never reassign ownership.
    if (user.role?.type === 'instructor' && ctx.request.body?.data) {
      delete ctx.request.body.data.owner;
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const course = await findCourseByDocumentId(strapi, ctx.params.id);

    if (!course) return ctx.notFound('Course not found.');
    if (!canManageCourse(user, course)) {
      return ctx.forbidden('You do not have permission to delete this course.');
    }

    return super.delete(ctx);
  },

  // POST /api/courses/:id/enroll  (student only) — :id is the course's documentId
  async enroll(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');
    if (!isStudent(user)) return ctx.forbidden('Only students can enroll in courses.');

    const course = await findCourseByDocumentId(strapi, ctx.params.id);
    if (!course) return ctx.notFound('Course not found.');

    const existing = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: { user: user.id, course: course.id },
    });
    if (existing) {
      return ctx.badRequest('You are already enrolled in this course.');
    }

    const enrollment = await strapi.db.query('api::enrollment.enrollment').create({
      data: { user: user.id, course: course.id, enrolledAt: new Date() },
    });

    ctx.body = { data: enrollment };
  },

  // GET /api/courses/:id/progress  -> percentage complete for the current student
  // :id is the course's documentId. Privileged roles may pass ?studentId=X to
  // inspect a specific student's progress, subject to the same course-ownership
  // rules as editing.
  async progress(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const { studentId } = ctx.query;
    const course = await findCourseByDocumentId(strapi, ctx.params.id);
    if (!course) return ctx.notFound('Course not found.');

    let targetUserId = user.id;

    if (studentId && Number(studentId) !== user.id) {
      if (!canManageCourse(user, course)) {
        return ctx.forbidden('You cannot view another student\'s progress for this course.');
      }
      targetUserId = Number(studentId);
    } else if (isStudent(user)) {
      const enrolled = await strapi.db.query('api::enrollment.enrollment').findOne({
        where: { user: user.id, course: course.id },
      });
      if (!enrolled) return ctx.forbidden('You are not enrolled in this course.');
    }

    const totalLessons = await strapi.db.query('api::lesson.lesson').count({
      where: { course: course.id },
    });

    const completedLessons = await strapi.db.query('api::lesson-progress.lesson-progress').count({
      where: { course: course.id, user: targetUserId, completed: true },
    });

    const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    ctx.body = {
      data: {
        courseId: course.documentId,
        studentId: targetUserId,
        totalLessons,
        completedLessons,
        percentage,
      },
    };
  },
}));









