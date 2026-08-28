'use strict';

/**
 * Role helpers shared by custom controllers.
 * Role "type" values used across this project: admin, content_manager, instructor, authenticated (student).
 * We treat the plain "authenticated" default Strapi role as the Student role for this project
 * (see bootstrap.js, which renames/creates the four custom roles on first boot).
 */

const isAdmin = (user) => !!user && !!user.role && user.role.type === 'admin';
const isContentManager = (user) => !!user && !!user.role && user.role.type === 'content_manager';
const isInstructor = (user) => !!user && !!user.role && user.role.type === 'instructor';
const isStudent = (user) => !!user && !!user.role && user.role.type === 'student';

const canManageAllCourses = (user) => isAdmin(user) || isContentManager(user);

/**
 * Returns true if the given user may create/edit/delete the given course.
 * - Admin & Content Manager: any course.
 * - Instructor: only a course they own.
 */
const canManageCourse = (user, course) => {
  if (!user || !course) return false;
  if (canManageAllCourses(user)) return true;
  if (isInstructor(user)) {
    const ownerId = course.owner?.id ?? course.owner;
    return ownerId === user.id;
  }
  return false;
};

module.exports = {
  isAdmin,
  isContentManager,
  isInstructor,
  isStudent,
  canManageAllCourses,
  canManageCourse,
};
