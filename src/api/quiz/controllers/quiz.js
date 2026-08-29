// 'use strict';

// const { createCoreController } = require('@strapi/strapi').factories;
// const { canManageCourse, isStudent } = require('../../../utils/access');

// const getQuizWithCourse = async (strapi, quizId) => {
//   return strapi.db.query('api::quiz.quiz').findOne({
//     where: { id: quizId },
//     populate: { course: { populate: ['owner'] } },
//   });
// };

// // Never let a student-facing response include the correct answer index.
// const sanitizeQuiz = (quiz) => {
//   if (!quiz) return quiz;
//   const clone = JSON.parse(JSON.stringify(quiz));
//   if (Array.isArray(clone.questions)) {
//     clone.questions = clone.questions.map(({ correctOptionIndex, ...rest }) => rest);
//   }
//   return clone;
// };

// module.exports = createCoreController('api::quiz.quiz', ({ strapi }) => ({
//   async create(ctx) {
//     const user = ctx.state.user;
//     const courseId = ctx.request.body?.data?.course;
//     if (!user || !courseId) return ctx.badRequest('A course id is required.');

//     const course = await strapi.db.query('api::course.course').findOne({
//       where: { id: courseId },
//       populate: ['owner'],
//     });
//     if (!course) return ctx.notFound('Course not found.');
//     if (!canManageCourse(user, course)) {
//       return ctx.forbidden('You do not have permission to add a quiz to this course.');
//     }

//     return super.create(ctx);
//   },

//   async update(ctx) {
//     const user = ctx.state.user;
//     const quiz = await getQuizWithCourse(strapi, ctx.params.id);
//     if (!quiz) return ctx.notFound('Quiz not found.');
//     if (!canManageCourse(user, quiz.course)) {
//       return ctx.forbidden('You do not have permission to edit this quiz.');
//     }
//     return super.update(ctx);
//   },

//   async delete(ctx) {
//     const user = ctx.state.user;
//     const quiz = await getQuizWithCourse(strapi, ctx.params.id);
//     if (!quiz) return ctx.notFound('Quiz not found.');
//     if (!canManageCourse(user, quiz.course)) {
//       return ctx.forbidden('You do not have permission to delete this quiz.');
//     }
//     return super.delete(ctx);
//   },

//   async findOne(ctx) {
//     const user = ctx.state.user;
//     if (!user) return ctx.unauthorized('You must be logged in.');

//     const quiz = await getQuizWithCourse(strapi, ctx.params.id);
//     if (!quiz) return ctx.notFound('Quiz not found.');

//     const privileged = canManageCourse(user, quiz.course);

//     if (!privileged && isStudent(user)) {
//       const enrolled = await strapi.db.query('api::enrollment.enrollment').findOne({
//         where: { user: user.id, course: quiz.course.id },
//       });
//       if (!enrolled) return ctx.forbidden('You are not enrolled in this course.');
//     } else if (!privileged) {
//       return ctx.forbidden('You do not have access to this quiz.');
//     }

//     ctx.body = { data: privileged ? quiz : sanitizeQuiz(quiz) };
//   },

//   // POST /api/quizzes/:id/submit  { answers: [optionIndex, ...] }  (student only)
//   async submit(ctx) {
//     const user = ctx.state.user;
//     if (!user) return ctx.unauthorized('You must be logged in.');
//     if (!isStudent(user)) return ctx.forbidden('Only students can submit quizzes.');

//     const { answers } = ctx.request.body || {};
//     if (!Array.isArray(answers)) return ctx.badRequest('answers must be an array of option indices.');

//     const quiz = await getQuizWithCourse(strapi, ctx.params.id);
//     if (!quiz) return ctx.notFound('Quiz not found.');

//     const enrolled = await strapi.db.query('api::enrollment.enrollment').findOne({
//       where: { user: user.id, course: quiz.course.id },
//     });
//     if (!enrolled) return ctx.forbidden('You must be enrolled in this course first.');

//     const questions = quiz.questions || [];
//     let score = 0;
//     questions.forEach((q, i) => {
//       if (answers[i] === q.correctOptionIndex) score += 1;
//     });

//     const result = await strapi.db.query('api::quiz-result.quiz-result').create({
//       data: {
//         user: user.id,
//         quiz: quiz.id,
//         course: quiz.course.id,
//         score,
//         totalQuestions: questions.length,
//         answers,
//         submittedAt: new Date(),
//       },
//     });

//     ctx.body = {
//       data: {
//         resultId: result.id,
//         score,
//         totalQuestions: questions.length,
//         percentage: questions.length === 0 ? 0 : Math.round((score / questions.length) * 100),
//       },
//     };
//   },
// }));
































'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { canManageCourse, isStudent } = require('../../../utils/access');

// quizDocumentId is the quiz's documentId (Strapi 5 route :id param).
const getQuizWithCourse = async (strapi, quizDocumentId) => {
  return strapi.db.query('api::quiz.quiz').findOne({
    where: { documentId: quizDocumentId },
    populate: { course: { populate: ['owner'] } },
  });
};

// Never let a student-facing response include the correct answer index.
const sanitizeQuiz = (quiz) => {
  if (!quiz) return quiz;
  const clone = JSON.parse(JSON.stringify(quiz));
  if (Array.isArray(clone.questions)) {
    clone.questions = clone.questions.map(({ correctOptionIndex, ...rest }) => rest);
  }
  return clone;
};

module.exports = createCoreController('api::quiz.quiz', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const { filters } = ctx.query || {};
    let courseNumericId = null;

    if (filters && filters.course && filters.course.id) {
      courseNumericId = Number(filters.course.id);
    }

    if (courseNumericId) {
      const quizzes = await strapi.db.query('api::quiz.quiz').findMany({
        where: { course: courseNumericId },
      });

      const privileged = user.role?.type && ['admin', 'content_manager', 'instructor'].includes(user.role.type);
      const sanitized = quizzes.map((q) => (privileged ? q : sanitizeQuiz(q)));
      return { data: sanitized };
    }

    return super.find(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;
    // The frontend sends the parent course's documentId as the relation value.
    const courseDocumentId = ctx.request.body?.data?.course;
    if (!user || !courseDocumentId) return ctx.badRequest('A course id is required.');

    const course = await strapi.db.query('api::course.course').findOne({
      where: { documentId: courseDocumentId },
      populate: ['owner'],
    });
    if (!course) return ctx.notFound('Course not found.');
    if (!canManageCourse(user, course)) {
      return ctx.forbidden('You do not have permission to add a quiz to this course.');
    }

    return super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    const quiz = await getQuizWithCourse(strapi, ctx.params.id);
    if (!quiz) return ctx.notFound('Quiz not found.');
    if (!canManageCourse(user, quiz.course)) {
      return ctx.forbidden('You do not have permission to edit this quiz.');
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const quiz = await getQuizWithCourse(strapi, ctx.params.id);
    if (!quiz) return ctx.notFound('Quiz not found.');
    if (!canManageCourse(user, quiz.course)) {
      return ctx.forbidden('You do not have permission to delete this quiz.');
    }
    return super.delete(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const quiz = await getQuizWithCourse(strapi, ctx.params.id);
    if (!quiz) return ctx.notFound('Quiz not found.');

    const privileged = canManageCourse(user, quiz.course);

    if (!privileged && isStudent(user)) {
      const enrolled = await strapi.db.query('api::enrollment.enrollment').findOne({
        where: { user: user.id, course: quiz.course.id },
      });
      if (!enrolled) return ctx.forbidden('You are not enrolled in this course.');
    } else if (!privileged) {
      return ctx.forbidden('You do not have access to this quiz.');
    }

    ctx.body = { data: privileged ? quiz : sanitizeQuiz(quiz) };
  },

  // POST /api/quizzes/:id/submit  { answers: [optionIndex, ...] }  (student only)
  async submit(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');
    if (!isStudent(user)) return ctx.forbidden('Only students can submit quizzes.');

    const { answers } = ctx.request.body || {};
    if (!Array.isArray(answers)) return ctx.badRequest('answers must be an array of option indices.');

    const quiz = await getQuizWithCourse(strapi, ctx.params.id);
    if (!quiz) return ctx.notFound('Quiz not found.');

    const enrolled = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: { user: user.id, course: quiz.course.id },
    });
    if (!enrolled) return ctx.forbidden('You must be enrolled in this course first.');

    const questions = quiz.questions || [];
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) score += 1;
    });

    const result = await strapi.db.query('api::quiz-result.quiz-result').create({
      data: {
        user: user.id,
        quiz: quiz.id,
        course: quiz.course.id,
        score,
        totalQuestions: questions.length,
        answers,
        submittedAt: new Date(),
      },
    });

    ctx.body = {
      data: {
        resultId: result.id,
        score,
        totalQuestions: questions.length,
        percentage: questions.length === 0 ? 0 : Math.round((score / questions.length) * 100),
      },
    };
  },
}));