'use strict';

// This file defines exactly which controller actions each of the 4 roles can call.
// It runs on every server boot and is idempotent: existing roles/permissions are
// reused, not duplicated. This is what makes the permission matrix from the brief
// enforced data (in the users-permissions plugin) rather than something you have
// to remember to click through in the admin panel by hand.

const ROLE_DEFINITIONS = [
  {
    type: 'admin',
    name: 'Admin',
    description: 'Full control of the platform.',
  },
  {
    type: 'content_manager',
    name: 'Content Manager',
    description: 'Creates and manages the course library, platform-wide.',
  },
  {
    type: 'instructor',
    name: 'Instructor',
    description: 'Manages lessons/quizzes for their own courses and views their students\' progress.',
  },
  {
    type: 'student',
    name: 'Student',
    description: 'Enrolls in courses, takes lessons and quizzes, tracks their own progress.',
  },
];

// permission "action" strings follow Strapi's `<uid>.<action>` convention for
// content-type controllers, and `<uid>.<methodName>` for custom controller actions.
const PERMISSIONS_BY_ROLE = {
  public: [
    'api::custom-auth.custom-auth.register',
    'api::custom-auth.custom-auth.me',
    'plugin::users-permissions.auth.login',
    'plugin::users-permissions.auth.forgotPassword',
    'plugin::users-permissions.auth.resetPassword',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
  ],
  admin: [
    'plugin::users-permissions.user.me',
    'api::custom-auth.custom-auth.me',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::course.course.create',
    'api::course.course.update',
    'api::course.course.delete',
    'api::course.course.enroll',
    'api::course.course.progress',
    'api::lesson.lesson.find',
    'api::lesson.lesson.findOne',
    'api::lesson.lesson.create',
    'api::lesson.lesson.update',
    'api::lesson.lesson.delete',
    'api::lesson.lesson.complete',
    'api::quiz.quiz.find',
    'api::quiz.quiz.findOne',
    'api::quiz.quiz.create',
    'api::quiz.quiz.update',
    'api::quiz.quiz.delete',
    'api::quiz.quiz.submit',
    'api::enrollment.enrollment.find',
    'api::enrollment.enrollment.findOne',
    'api::lesson-progress.lesson-progress.find',
    'api::quiz-result.quiz-result.find',
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
    'api::blog-post.blog-post.create',
    'api::blog-post.blog-post.update',
    'api::blog-post.blog-post.delete',
    'api::admin-stats.admin-stats.index',
    'api::admin-users.admin-users.find',
    'api::admin-users.admin-users.changeRole',
  ],
  content_manager: [
    'plugin::users-permissions.user.me',
    'api::custom-auth.custom-auth.me',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::course.course.create',
    'api::course.course.update',
    'api::course.course.delete',
    'api::lesson.lesson.find',
    'api::lesson.lesson.findOne',
    'api::lesson.lesson.create',
    'api::lesson.lesson.update',
    'api::lesson.lesson.delete',
    'api::quiz.quiz.find',
    'api::quiz.quiz.findOne',
    'api::quiz.quiz.create',
    'api::quiz.quiz.update',
    'api::quiz.quiz.delete',
    'api::enrollment.enrollment.find',
    'api::enrollment.enrollment.findOne',
    'api::lesson-progress.lesson-progress.find',
    'api::quiz-result.quiz-result.find',
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
    'api::blog-post.blog-post.create',
    'api::blog-post.blog-post.update',
    'api::blog-post.blog-post.delete',
  ],
  instructor: [
    'plugin::users-permissions.user.me',
    'api::custom-auth.custom-auth.me',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::course.course.create',
    'api::course.course.update',
    'api::course.course.delete',
    'api::course.course.progress',
    'api::lesson.lesson.find',
    'api::lesson.lesson.findOne',
    'api::lesson.lesson.create',
    'api::lesson.lesson.update',
    'api::lesson.lesson.delete',
    'api::quiz.quiz.find',
    'api::quiz.quiz.findOne',
    'api::quiz.quiz.create',
    'api::quiz.quiz.update',
    'api::quiz.quiz.delete',
    'api::enrollment.enrollment.find',
    'api::enrollment.enrollment.findOne',
    'api::lesson-progress.lesson-progress.find',
    'api::quiz-result.quiz-result.find',
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
  ],
  student: [
    'plugin::users-permissions.user.me',
    'api::custom-auth.custom-auth.me',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::course.course.enroll',
    'api::course.course.progress',
    'api::lesson.lesson.find',
    'api::lesson.lesson.findOne',
    'api::lesson.lesson.complete',
    'api::quiz.quiz.findOne',
    'api::quiz.quiz.submit',
    'api::enrollment.enrollment.find',
    'api::enrollment.enrollment.findOne',
    'api::enrollment.enrollment.create',
    'api::lesson-progress.lesson-progress.find',
    'api::quiz-result.quiz-result.find',
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
  ],
};

const actionToPluginController = (action) => {
  const parts = action.split('.');
  const actionName = parts.pop();
  const controllerName = parts.pop();
  const uid = parts.join('.');
  return { uid, controllerName, actionName };
};

async function ensureRoles(strapi) {
  const roleMap = {};

  for (const def of ROLE_DEFINITIONS) {
    let role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: def.type },
    });
    if (!role) {
      role = await strapi.db.query('plugin::users-permissions.role').create({
        data: { name: def.name, description: def.description, type: def.type },
      });
      strapi.log.info(`[bootstrap] Created role: ${def.name}`);
    }
    roleMap[def.type] = role;
  }

  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (publicRole) roleMap.public = publicRole;

  return roleMap;
}

async function setPermissionsForRole(strapi, role, actions) {
  for (const action of actions) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { role: role.id, action },
    });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: { action, role: role.id },
      });
    }
  }
}

module.exports = async ({ strapi }) => {
  try {
    const roles = await ensureRoles(strapi);

    for (const [roleType, actions] of Object.entries(PERMISSIONS_BY_ROLE)) {
      const role = roles[roleType];
      if (!role) continue;
      await setPermissionsForRole(strapi, role, actions);
    }

    strapi.log.info('[bootstrap] Role permissions synced (admin, content_manager, instructor, student).');
  } catch (err) {
    strapi.log.error('[bootstrap] Failed to sync roles/permissions:', err);
  }
};
