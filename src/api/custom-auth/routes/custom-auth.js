'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/custom-auth/register',
      handler: 'custom-auth.register',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/custom-auth/me',
      handler: 'custom-auth.me',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
