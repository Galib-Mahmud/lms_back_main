'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/custom-auth/register',
      handler: 'api::custom-auth.custom-auth.register',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/custom-auth/me',
      handler: 'api::custom-auth.custom-auth.me',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
