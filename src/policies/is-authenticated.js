'use strict';

module.exports = (policyContext, config, { strapi }) => {
  if (policyContext.state.user) {
    return true;
  }
  return false;
};
