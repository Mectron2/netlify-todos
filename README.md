# Netlify Todos

A full-stack React + Netlify Functions demo that stores todos in a Neon/Postgres database through Prisma. This update adds email/password authentication with JSON Web Tokens (JWT) so each user sees only their own todos.

## Prerequisites

- Node.js 20+
- A Postgres database (Neon is a great free option)
- Netlify CLI (optional but handy for local function testing)

## Environment Variables

Create a `.env` file (or configure these in Netlify) before running anything:

| Name | Description |
| --- | --- |
| `NETLIFY_DATABASE_URL` | Connection string to your Postgres database. Prisma uses this for migrations and Netlify Functions use it at runtime. |
| `JWT_SECRET` | A long random string used to sign/verify JWTs. Keep it private. |

> ⚠️ The new Prisma schema adds a `User` model and a `userId` foreign key on `Todo`. If you already had todos in the database, either back them up and re-create them per user or run a manual migration to populate `userId`.

## Installation & Local Development

```bash
npm install
# generate/update the Prisma client
npm run postinstall
# create the new tables/columns
npx prisma migrate dev
# start Vite + Netlify functions locally
npm run dev
```

The React app now prompts for email/password. Registering hits `/.netlify/functions/register`, which stores the user with a bcrypt-hashed password and returns a JWT. Subsequent logins go through `/.netlify/functions/login`. The token is stored in `localStorage` and sent as a `Bearer` token for every todo request.

## Netlify Functions

| Function | Purpose |
| --- | --- |
| `register` | Creates a user, hashes their password, and returns a JWT + user object. |
| `login` | Verifies credentials and returns a JWT + user object. |
| `get-todos` | Requires a valid JWT, then returns todos scoped to the authenticated user. |
| `create-todo` | Creates a todo for the authenticated user. |
| `update-todo` | Ensures the todo belongs to the user before toggling completion. |
| `delete-todo` | Ensures the todo belongs to the user before deleting. |

All handlers share `lib/auth.ts`, which verifies/creates tokens and hashes passwords. If a request fails authentication they respond with `401 Unauthorized`.

## Deployment Tips

- Add `JWT_SECRET` and `NETLIFY_DATABASE_URL` to your Netlify environment variables.
- Re-run `npx prisma migrate deploy` whenever the Prisma schema changes (e.g., in CI/CD).
- Because every todo is tied to a user, the UI automatically scopes data per account.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts Vite and proxies to local Netlify Functions. |
| `npm run build` | Generates the Prisma client and builds the React app. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint. |
