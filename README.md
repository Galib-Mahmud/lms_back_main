# LMS Backend — Strapi 5

Headless CMS/API powering the LMS platform: courses, lessons, MCQ quizzes with
auto-grading, enrollment, per-student progress tracking, a draft/published blog,
and a role-based permission system for four roles — **Admin, Content Manager,
Instructor, Student** — enforced on the server, not just hidden in the UI.

## What's in here

| Content type      | Purpose                                                       |
|--------------------|----------------------------------------------------------------|
| `course`           | Title, description, cover image, owner (the instructor who created it, or an admin/content manager) |
| `lesson`           | Belongs to a course; text content and/or a video URL           |
| `quiz`             | Belongs to a course; repeatable MCQ `quiz.question` components |
| `enrollment`       | Links a student to a course                                    |
| `lesson-progress`  | Tracks whether a student completed a specific lesson           |
| `quiz-result`      | A student's graded quiz attempt                                |
| `blog-post`        | Title/body/cover image + `draft`/`published` status            |

Custom endpoints (in addition to the standard REST CRUD Strapi generates for
every content type above):

```
POST /api/custom-auth/register        Public. Self-service signup (student/instructor only)
POST /api/courses/:id/enroll          Student enrolls in a course
GET  /api/courses/:id/progress        Student's (or, for privileged roles, any student's) % complete
POST /api/lessons/:id/complete        Mark a lesson complete for the logged-in student
POST /api/quizzes/:id/submit          Submit quiz answers, get graded instantly
GET  /api/admin-stats                 Admin-only platform stats
GET  /api/admin-users                 Admin-only list of all users
PUT  /api/admin-users/:id/role        Admin-only: change a user's role
```

Role permissions are **not** something you have to click through by hand in
the admin panel — `src/bootstrap-roles.js` creates the four roles
(`admin`, `content_manager`, `instructor`, `student`) and wires up exactly
which of the above actions each one can call, every time the server boots.
It's idempotent, so it's safe to run repeatedly.

## 1. Local setup

Requirements: Node.js 18–22, npm 6+.

```bash
cd lms-backend
npm install
cp .env.example .env
```

Open `.env` and replace every `replaceWithRandomString` value. Generate each one with:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

Run it 5 times for `APP_KEYS` (needs 4 comma-separated values) and the other
4 secrets. Leave `DATABASE_CLIENT=sqlite` for local dev — zero extra setup.

Start the dev server:

```bash
npm run develop
```

- Admin panel: http://localhost:1337/admin — the first visit prompts you to create
  your Strapi **admin panel** super-admin account. This is separate from the
  app's own `admin` role/users — it's the CMS operator login.
- API base URL: http://localhost:1337/api
- On first boot, check your terminal for `[bootstrap] Created role: ...` — this
  confirms the four roles were created successfully.

### Creating your first real Admin (app-role) user

Self-signup (`/api/custom-auth/register`) can only create `student` or
`instructor` accounts — that's intentional, so nobody can register themselves
as an Admin or Content Manager from the public signup form. To create your
first Admin:

1. Register a normal account through the frontend (role: student).
2. In the Strapi admin panel, go to **Content Manager → User** (not Users &
   Permissions plugin settings — the actual `up_users` collection), open that
   user, and change their `role` relation to `Admin`.
3. Log back into the frontend with that account — it now has full admin access,
   including the ability to promote/demote any other user's role from the
   in-app Admin Dashboard (no more manual admin-panel edits needed after this).

## 2. Deploying to Railway

1. Push this `lms-backend` folder to its own GitHub repo.
2. On [railway.app](https://railway.app), **New Project → Deploy from GitHub repo** → select the repo.
3. Add a **PostgreSQL** database to the project (`+ New` → `Database` → `PostgreSQL`).
   Railway gives it a `DATABASE_URL` variable automatically.
4. On your Strapi service, open **Variables** and add:
   ```
   HOST=0.0.0.0
   PORT=1337
   PUBLIC_URL=https://<your-service>.up.railway.app
   APP_KEYS=<4 comma-separated random strings>
   API_TOKEN_SALT=<random string>
   ADMIN_JWT_SECRET=<random string>
   TRANSFER_TOKEN_SALT=<random string>
   JWT_SECRET=<random string>
   ENCRYPTION_KEY=<random string>
   DATABASE_CLIENT=postgres
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   DATABASE_SSL=true
   DATABASE_SSL_REJECT_UNAUTHORIZED=false
   CORS_ORIGINS=https://your-frontend.vercel.app
   NODE_ENV=production
   ```
   (`${{Postgres.DATABASE_URL}}` is Railway's variable-reference syntax — pick
   your actual Postgres service name from the variable picker.)
5. Set the **Start Command** to `npm run build && npm run start` (or leave
   build/start as separate Railway build/deploy steps if you prefer — either
   works, since `npm run build` compiles the admin panel and `npm run start`
   runs the server).
6. Deploy. Once live, visit `https://<your-service>.up.railway.app/admin` to
   create your Strapi super-admin, exactly as in local setup.
7. Update `CORS_ORIGINS` once your Vercel frontend URL is known, and redeploy.

### Notes
- Uploaded files (cover images etc. if you extend this to use Strapi's Media
  Library instead of plain URL fields) won't persist across Railway redeploys
  on the local filesystem — add an S3-compatible provider
  (`@strapi/provider-upload-aws-s3` or Railway's volumes) before relying on it
  in production. This project ships with simple `coverImageUrl` string fields
  specifically to sidestep that for a fast, reliable first deploy.
- Free Postgres/Railway tiers can idle/sleep; first request after idle may be slow.
