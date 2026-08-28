'use strict';

module.exports = {
  async index(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') {
      return ctx.forbidden('Admins only.');
    }

    const [totalCourses, totalEnrollments, totalBlogPosts, totalPublishedPosts, totalQuizzes] =
      await Promise.all([
        strapi.db.query('api::course.course').count(),
        strapi.db.query('api::enrollment.enrollment').count(),
        strapi.db.query('api::blog-post.blog-post').count(),
        strapi.db.query('api::blog-post.blog-post').count({ where: { status: 'published' } }),
        strapi.db.query('api::quiz.quiz').count(),
      ]);

    const roles = ['admin', 'content_manager', 'instructor', 'student'];
    const usersByRole = {};
    for (const roleType of roles) {
      const role = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: roleType },
      });
      usersByRole[roleType] = role
        ? await strapi.db.query('plugin::users-permissions.user').count({ where: { role: role.id } })
        : 0;
    }

    const totalUsers = Object.values(usersByRole).reduce((a, b) => a + b, 0);

    ctx.body = {
      data: {
        totalUsers,
        usersByRole,
        totalCourses,
        totalEnrollments,
        totalBlogPosts,
        totalPublishedPosts,
        totalQuizzes,
      },
    };
  },
};
