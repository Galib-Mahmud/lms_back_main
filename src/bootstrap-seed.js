'use strict';

module.exports = async (strapi) => {
  try {
    strapi.log.info('[seed] Performing raw PostgreSQL table wipe for demo entities...');

    // Raw PostgreSQL wipe to ensure zero stale or orphaned rows
    try {
      await strapi.db.connection('lesson_progresses').del();
      await strapi.db.connection('enrollments').del();
      await strapi.db.connection('quiz_results').del();
      await strapi.db.connection('quizzes').del();
      await strapi.db.connection('lessons').del();
      await strapi.db.connection('courses').del();
    } catch {
      // Fallback if table name variant differs
    }

    strapi.log.info('[seed] Creating fresh Strapi 5 LMS demo data...');

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

    // 1. Course 1: Full-Stack Web Architecture
    const course1 = await courseDoc.create({
      data: {
        title: 'Full-Stack Web Architecture with Next.js 15 & Strapi 5',
        slug: 'fullstack-web-architecture',
        description: 'Master modern web development from database design to server-side rendering. Learn Strapi 5 REST API integration, Next.js App Router, role-based access control, and cloud deployment.',
        coverImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        owner: instructorUser.id,
      },
      status: 'published',
    });

    const c1Lesson1 = await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '01. Introduction to Modern Headless Architecture',
        order: 1,
        content: `Modern web engineering separates presentation from backend data logic.
In this lesson, we explore Headless CMS paradigms, Next.js 15 App Router server components, RESTful API consumption, and JSON Web Token security standards.

Key Highlights:
- Decoupled frontend vs monolithic MVC
- Server-side rendering (SSR) & Static Site Generation (SSG)
- Stateless authentication with JWT`,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        course: course1.id,
        publishedAt: new Date(),
      },
    });

    const c1Lesson2 = await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '02. Relational Schemas & Strapi 5 Permissions',
        order: 2,
        content: `Understand Strapi 5 entity relationships, custom controllers, documentId resolution vs database primary keys, and RBAC matrix enforcement.

Key Highlights:
- Content-type builder & relations
- DocumentID vs numeric database IDs
- Role-based route guards at controller level`,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        course: course1.id,
        publishedAt: new Date(),
      },
    });

    await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '03. Crafting Glassmorphic UI with CSS Design Tokens',
        order: 3,
        content: `Build visually stunning user interfaces using modern CSS token systems, custom color scales, smooth micro-animations, and responsive layout containers.`,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        course: course1.id,
        publishedAt: new Date(),
      },
    });

    await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '04. State Persistence & Auto-Graded MCQ Engine',
        order: 4,
        content: `Build an automated quiz grading system that calculates student percentages in real-time, persists completion progress, and prevents unauthorized access to answers.`,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        course: course1.id,
        publishedAt: new Date(),
      },
    });

    await quizDoc.create({
      data: {
        title: 'Full-Stack Mastery Assessment',
        course: course1.documentId,
        questions: [
          {
            questionText: 'What is the primary purpose of a Headless CMS like Strapi?',
            options: [
              'To render client-side HTML templates',
              'To separate backend content management from the frontend presentation layer',
              'To replace SQL databases entirely',
              'To build native mobile application code',
            ],
            correctOptionIndex: 1,
          },
          {
            questionText: 'How does Next.js 15 handle component rendering by default?',
            options: [
              'All components are client components',
              'Components are React Server Components unless specified with "use client"',
              'Server components cannot receive props',
              'Components must be written in Vue.js',
            ],
            correctOptionIndex: 1,
          },
          {
            questionText: 'Where must role-based access control (RBAC) be strictly enforced?',
            options: [
              'Only in frontend UI state',
              'On backend API controllers and database endpoints',
              'In local browser storage',
              'In CSS visibility rules',
            ],
            correctOptionIndex: 1,
          },
        ],
      },
      status: 'published',
    });

    // 2. Course 2: UI/UX & High-Impact Design Systems
    const course2 = await courseDoc.create({
      data: {
        title: 'UI/UX & High-Impact Design Systems',
        slug: 'ui-ux-design-systems',
        description: 'Craft stunning user interfaces with custom color systems, typography scale, micro-animations, glassmorphism, and responsive layouts that wow users at first glance.',
        coverImageUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
        owner: instructorUser.id,
      },
      status: 'published',
    });

    await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '01. The Science of Color Systems & Contrast',
        order: 1,
        content: `Explore color psychology, accessible contrast ratios, CSS custom properties, and dark mode tokens. Learn why avoiding raw browser defaults elevates visual design.`,
        course: course2.id,
        publishedAt: new Date(),
      },
    });

    await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '02. Typography Scale & Visual Hierarchy',
        order: 2,
        content: `Pair display serif fonts with clean sans-serif body text and monospace metadata. Establish clear visual hierarchy using font scale, weight, and line-height.`,
        course: course2.id,
        publishedAt: new Date(),
      },
    });

    await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '03. Micro-Animations & Responsive Design',
        order: 3,
        content: `Add interactive hover states, glassmorphism backdrop blurs, animated completion stamps, and skeleton loaders to provide delightful feedback to users.`,
        course: course2.id,
        publishedAt: new Date(),
      },
    });

    await quizDoc.create({
      data: {
        title: 'UI/UX Design Systems Quiz',
        course: course2.documentId,
        questions: [
          {
            questionText: 'Why is visual hierarchy critical in modern user interface design?',
            options: [
              'It makes web pages look darker',
              'It guides user focus to key call-to-actions and improves readability',
              'It reduces HTTP requests',
              'It disables browser scrollbars',
            ],
            correctOptionIndex: 1,
          },
        ],
      },
      status: 'published',
    });

    // 3. Course 3: Data Science & Machine Learning Foundations
    const course3 = await courseDoc.create({
      data: {
        title: 'Applied Python for Data Science & Machine Learning',
        slug: 'applied-python-data-science',
        description: 'From data wrangling with Pandas to training machine learning models. Learn data visualization, statistical hypothesis testing, and neural network foundations.',
        coverImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        owner: managerUser.id,
      },
      status: 'published',
    });

    await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '01. Exploratory Data Analysis with Pandas & Seaborn',
        order: 1,
        content: `Master data cleaning, handling missing values, calculating summary statistics, and generating statistical charts in Python.`,
        course: course3.id,
        publishedAt: new Date(),
      },
    });

    await strapi.db.query('api::lesson.lesson').create({
      data: {
        title: '02. Supervised Machine Learning Models',
        order: 2,
        content: `Train decision trees, logistic regression, and random forests using Scikit-Learn. Evaluate model performance with confusion matrices and F1 scores.`,
        course: course3.id,
        publishedAt: new Date(),
      },
    });

    await quizDoc.create({
      data: {
        title: 'Data Science Fundamentals Quiz',
        course: course3.documentId,
        questions: [
          {
            questionText: 'Which Python library is widely used for tabular data manipulation?',
            options: ['Flask', 'Pandas', 'Django', 'PyGame'],
            correctOptionIndex: 1,
          },
        ],
      },
      status: 'published',
    });

    // Create Student Enrollment & Progress for Course 1
    await strapi.db.query('api::enrollment.enrollment').create({
      data: {
        user: studentUser.id,
        course: course1.id,
        enrolledAt: new Date(),
        publishedAt: new Date(),
      },
    });

    await strapi.db.query('api::lesson-progress.lesson-progress').create({
      data: {
        user: studentUser.id,
        lesson: c1Lesson1.id,
        course: course1.id,
        completed: true,
        completedAt: new Date(),
        publishedAt: new Date(),
      },
    });

    await strapi.db.query('api::lesson-progress.lesson-progress').create({
      data: {
        user: studentUser.id,
        lesson: c1Lesson2.id,
        course: course1.id,
        completed: true,
        completedAt: new Date(),
        publishedAt: new Date(),
      },
    });

    strapi.log.info('[seed] Fresh Strapi 5 demo courses, lessons, and quizzes seeded successfully!');
  } catch (err) {
    console.error('[seed] ERROR DETAILS:', err);
  }
};
