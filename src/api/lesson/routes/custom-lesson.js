'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/lessons/:id/complete',
      handler: 'lesson.complete',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
