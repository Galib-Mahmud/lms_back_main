'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/quizzes/:id/submit',
      handler: 'quiz.submit',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
