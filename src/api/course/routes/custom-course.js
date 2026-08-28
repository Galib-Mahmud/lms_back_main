'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/courses/:id/enroll',
      handler: 'course.enroll',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/courses/:id/progress',
      handler: 'course.progress',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
