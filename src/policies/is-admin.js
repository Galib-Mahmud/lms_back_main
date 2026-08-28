'use strict';

module.exports = (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  if (user.role && user.role.type === 'admin') {
    return true;
  }

  return false;
};
