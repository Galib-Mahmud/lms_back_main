'use strict';

module.exports = (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;
  if (!user || !user.role) return false;

  return ['admin', 'content_manager'].includes(user.role.type);
};
