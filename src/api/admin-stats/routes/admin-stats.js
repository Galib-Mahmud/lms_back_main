'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/admin-stats',
      handler: 'admin-stats.index',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
