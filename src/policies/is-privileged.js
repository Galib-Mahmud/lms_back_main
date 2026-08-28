'use strict';

// Any role that is allowed to create/manage some slice of course content:
// admin (everything), content_manager (everything), instructor (their own courses only).
// Fine-grained "own course only" checks happen inside the controllers themselves,
// since that requires looking up the specific record being touched.
module.exports = (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;
  if (!user || !user.role) return false;

  return ['admin', 'content_manager', 'instructor'].includes(user.role.type);
};
