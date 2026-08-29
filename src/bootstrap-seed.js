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
          owner: instructorUser.id,
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
          owner: instructorUser.id,
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
          owner: managerUser.id,
        },
        status: 'published',
      });
    }

    // Ensure Lessons Exist & Partition Correctly by Course
    const allLessons = await strapi.db.query('api::lesson.lesson').findMany({});

    if (allLessons.length === 0) {
      // Create lessons if missing
      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '01. Introduction to Modern Headless Architecture', order: 1, content: 'Modern web engineering separates presentation from backend data logic.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', course: course1.id, publishedAt: new Date() }
      });
      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '02. Relational Schemas & Strapi 5 Permissions', order: 2, content: 'Understand Strapi 5 entity relationships, custom controllers, documentId resolution vs database primary keys.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', course: course1.id, publishedAt: new Date() }
      });
      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '03. Crafting Glassmorphic UI with CSS Design Tokens', order: 3, content: 'Build visually stunning user interfaces using modern CSS token systems.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', course: course1.id, publishedAt: new Date() }
      });
      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '04. State Persistence & Auto-Graded MCQ Engine', order: 4, content: 'Build an automated quiz grading system that calculates student percentages in real-time.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', course: course1.id, publishedAt: new Date() }
      });

      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '01. The Science of Color Systems & Contrast', order: 1, content: 'Explore color psychology, accessible contrast ratios, CSS custom properties, and dark mode tokens.', course: course2.id, publishedAt: new Date() }
      });
      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '02. Typography Scale & Visual Hierarchy', order: 2, content: 'Pair display serif fonts with clean sans-serif body text and monospace metadata.', course: course2.id, publishedAt: new Date() }
      });
      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '03. Micro-Animations & Responsive Design', order: 3, content: 'Add interactive hover states, glassmorphism backdrop blurs, and animated completion stamps.', course: course2.id, publishedAt: new Date() }
      });

      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '01. Exploratory Data Analysis with Pandas & Seaborn', order: 1, content: 'Master data cleaning, handling missing values, calculating summary statistics.', course: course3.id, publishedAt: new Date() }
      });
      await strapi.db.query('api::lesson.lesson').create({
        data: { title: '02. Supervised Machine Learning Models', order: 2, content: 'Train decision trees, logistic regression, and random forests using Scikit-Learn.', course: course3.id, publishedAt: new Date() }
      });
    } else {
      // Explicitly partition existing lessons to their matching course IDs
      for (const l of allLessons) {
        if (l.title.includes('Headless') || l.title.includes('Relational') || l.title.includes('Glassmorphic') || l.title.includes('Auto-Graded')) {
          await strapi.db.query('api::lesson.lesson').update({ where: { id: l.id }, data: { course: course1.id } });
        } else if (l.title.includes('Color Systems') || l.title.includes('Typography') || l.title.includes('Micro-Animations')) {
          await strapi.db.query('api::lesson.lesson').update({ where: { id: l.id }, data: { course: course2.id } });
        } else if (l.title.includes('Exploratory Data') || l.title.includes('Supervised Machine')) {
          await strapi.db.query('api::lesson.lesson').update({ where: { id: l.id }, data: { course: course3.id } });
        }
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

    strapi.log.info('[seed] Demo courses, partitioned lessons, and quizzes successfully verified and linked!');
  } catch (err) {
    console.error('[seed] ERROR DETAILS:', err);
  }
};
