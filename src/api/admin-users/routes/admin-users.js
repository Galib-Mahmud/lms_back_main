'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/admin-users',
      handler: 'admin-users.find',
      config: { policies: ['global::is-authenticated'] },
    },
    {
      method: 'PUT',
      path: '/admin-users/:id/role',
      handler: 'admin-users.changeRole',
      config: { policies: ['global::is-authenticated'] },
    },
  ],
};
