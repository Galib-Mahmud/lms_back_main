'use strict';

module.exports = async (strapi) => {
  try {
    strapi.log.info('[seed] Initializing Strapi 5 LMS seed & course partition migration...');

    const adminUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email: 'admin@example.com' } });
    const managerUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email: 'content@example.com' } });
    const instructorUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email: 'instructor@example.com' } });
    const studentUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email: 'student@example.com' } });

    if (!instructorUser || !adminUser || !studentUser) {
      strapi.log.warn('[seed] Users not found yet, skipping course seeding.');
      return;
    }

    const courseDoc = strapi.documents('api::course.course');
    const lessonDoc = strapi.documents('api::lesson.lesson');
    const quizDoc = strapi.documents('api::quiz.quiz');

    // Ensure 3 Core Courses Exist
    let course1 = await strapi.db.query('api::course.course').findOne({ where: { slug: 'fullstack-web-architecture' } });
    if (!course1) {
      course1 = await courseDoc.create({
        data: {
          title: 'Full-Stack Web Architecture with Next.js 15 & Strapi 5',
          slug: 'fullstack-web-architecture',
          description: 'Master modern web development from database design to server-side rendering. Learn Strapi 5 REST API integration, Next.js App Router, role-based access control, and cloud deployment.',
          coverImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
          owner: instructorUser.documentId,
        },
        status: 'published',
      });
    }

    let course2 = await strapi.db.query('api::course.course').findOne({ where: { slug: 'ui-ux-design-systems' } });
    if (!course2) {
      course2 = await courseDoc.create({
        data: {
          title: 'UI/UX & High-Impact Design Systems',
          slug: 'ui-ux-design-systems',
          description: 'Craft stunning user interfaces with custom color systems, typography scale, micro-animations, glassmorphism, and responsive layouts that wow users at first glance.',
          coverImageUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
          owner: instructorUser.documentId,
        },
        status: 'published',
      });
    }

    let course3 = await strapi.db.query('api::course.course').findOne({ where: { slug: 'applied-python-data-science' } });
    if (!course3) {
      course3 = await courseDoc.create({
        data: {
          title: 'Applied Python for Data Science & Machine Learning',
          slug: 'applied-python-data-science',
          description: 'From data wrangling with Pandas to training machine learning models. Learn data visualization, statistical hypothesis testing, and neural network foundations.',
          coverImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
          owner: managerUser.documentId,
        },
        status: 'published',
      });
    }

    // Partition existing lessons to their matching course documentIds in Strapi 5
    const allLessons = await lessonDoc.findMany({});
    for (const l of allLessons) {
      if (l.title.includes('Headless') || l.title.includes('Relational') || l.title.includes('Glassmorphic') || l.title.includes('Auto-Graded')) {
        await lessonDoc.update({ documentId: l.documentId, data: { course: course1.documentId } });
      } else if (l.title.includes('Color Systems') || l.title.includes('Typography') || l.title.includes('Micro-Animations')) {
        await lessonDoc.update({ documentId: l.documentId, data: { course: course2.documentId } });
      } else if (l.title.includes('Exploratory Data') || l.title.includes('Supervised Machine')) {
        await lessonDoc.update({ documentId: l.documentId, data: { course: course3.documentId } });
      }
    }

    // Ensure Quizzes Exist & Partition Correctly
    const existingQuizzes = await quizDoc.findMany({});
    if (existingQuizzes.length === 0) {
      await quizDoc.create({
        data: {
          title: 'Full-Stack Mastery Assessment',
          course: course1.documentId,
          questions: [
            { questionText: 'What is the primary purpose of a Headless CMS like Strapi?', options: ['Client HTML', 'Separate backend content from presentation', 'Replace SQL', 'Mobile code'], correctOptionIndex: 1 },
            { questionText: 'How does Next.js 15 handle component rendering by default?', options: ['All client', 'React Server Components by default', 'No props', 'Vue.js'], correctOptionIndex: 1 },
            { questionText: 'Where must role-based access control (RBAC) be strictly enforced?', options: ['Frontend only', 'On backend API controllers', 'LocalStorage', 'CSS'], correctOptionIndex: 1 },
          ],
        },
        status: 'published',
      });

      await quizDoc.create({
        data: {
          title: 'UI/UX Design Systems Quiz',
          course: course2.documentId,
          questions: [
            { questionText: 'Why is visual hierarchy critical in modern user interface design?', options: ['Make dark', 'Guides user focus to key call-to-actions', 'Reduce HTTP', 'Disable scroll'], correctOptionIndex: 1 },
          ],
        },
        status: 'published',
      });

      await quizDoc.create({
        data: {
          title: 'Data Science Fundamentals Quiz',
          course: course3.documentId,
          questions: [
            { questionText: 'Which Python library is widely used for tabular data manipulation?', options: ['Flask', 'Pandas', 'Django', 'PyGame'], correctOptionIndex: 1 },
          ],
        },
        status: 'published',
      });
    }

    // Ensure Student Enrollment for Course 1
    const existingEnroll = await strapi.db.query('api::enrollment.enrollment').findOne({ where: { user: studentUser.id, course: course1.id } });
    if (!existingEnroll) {
      await strapi.db.query('api::enrollment.enrollment').create({
        data: { user: studentUser.id, course: course1.id, enrolledAt: new Date(), publishedAt: new Date() },
      });
    }

    strapi.log.info('[seed] Demo courses, partitioned lessons, and quizzes successfully verified and linked via Strapi 5 documentId!');
  } catch (err) {
    console.error('[seed] ERROR DETAILS:', err);
  }
};
