# Assignment Management System — Client

A role-based **assignment and submission management portal** for schools and colleges. Admins manage users, classes, subjects, and teacher assignments; teachers create, publish, and grade assignments; students view published assignments and submit their work.

This is the **Next.js frontend** for the [Assignment Management Server](https://github.com/mizanurrahman70/assignment-management-server) REST API.

## Live Demo

**https://assignment-management-server-client.onrender.com**

> Demo accounts (seeded by the backend on first run)
>
> | Role | Email | Password |
> | --- | --- | --- |
> | Admin | `admin@school.edu` | `Admin@12345` |
> | Teacher | `john.doe@school.edu` | `Teacher@12345` |
> | Student | `alice.johnson@school.edu` | `Student@12345` |

## Features

### Role-based access (Admin / Teacher / Student)

| Role | Capabilities |
| --- | --- |
| **Admin** | Manage users (create/edit/activate/deactivate/delete), classes and subjects (CRUD), assign teachers to class+subject links, create and publish assignments, grade submissions |
| **Teacher** | Create, edit, publish/unpublish and delete assignments for their assigned class-subject links; review and grade student submissions with marks, feedback, and a status workflow |
| **Student** | Self-register, view published assignments for their class, submit or update answers before the deadline, and track submission status, marks, and feedback |

### Core workflow

- **Users** — server-paginated table with search and role/class filters; modals for create/edit; confirm-dialog deletes.
- **Classes & Subjects** — generic catalog CRUD (name + code).
- **Teacher Assignments** — link a class + subject to a teacher.
- **Assignments** — searchable, filterable list with publish badges and submission counts; creation form with cascading class → subject selects and auto-filled teacher; detail page with inline editing and publish/unpublish.
- **Submissions** — students submit text answers before the deadline (blocked once the deadline passes or the submission is graded); teachers grade with marks (validated against max marks) and feedback, driving the status lifecycle:
  `Submitted → InReview → Returned → Resubmitted → Graded`
- **Dashboard** — role-aware overview with stat cards, recent assignments, and submission activity.

### Technical highlights

- JWT auth stored in `localStorage` with global `401 → session-expired` handling
- Protected route group `(app)` redirecting unauthenticated users to `/login`
- Custom `useApi` hook (cancellation + dependency-driven refetch) over a typed service layer
- Server-side pagination, search, and role/class/subject filters
- Responsive `AppShell`: fixed sidebar on desktop, slide-in drawer with backdrop on mobile
- Hand-rolled UI kit (`Button`, `Input`, `Select`, `Modal`, `Card`, `Badge`, `Pagination`, `Spinner`, `Alert`, `EmptyState`, `ConfirmDialog`, `PageHeader`)
- react-hook-form + zod validation, auto-dismissing success notices, empty states, error boundary, and custom 404 page

## Tech Stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Styling:** Tailwind CSS v4 · Geist fonts
- **Forms:** react-hook-form · @hookform/resolvers · zod
- **Tooling:** ESLint 9 (`eslint-config-next`)
- **API:** typed service layer + custom `fetch` wrapper with envelope unwrapping

## Getting Started

### Prerequisites

- Node.js 20+
- A running instance of the [backend server](https://github.com/mizanurrahman70/assignment-management-server)

### 1. Clone and install

```bash
git clone https://github.com/mizanurrahman70/assignment-management-server-client.git
cd assignment-management-server-client
npm install
```

### 2. Configure environment

Create a `.env.local` file:

```env
BACKEND_URL=http://localhost:5068
```

`BACKEND_URL` is the base URL of the backend API. In development, `/api/*` requests are proxied to it via Next.js rewrites.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build & preview

```bash
npm run build
npm start
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `BACKEND_URL` | Yes | Base URL of the backend API (used by the `/api/*` rewrite proxy) |
| `NEXT_PUBLIC_API_URL` | No | Optional direct API base for browser calls (bypasses the proxy when set) |

## Project Structure

```
app/
├── login/            # Sign-in page
├── register/         # Student self-registration
└── (app)/            # Protected routes (dashboard, users, classes, subjects,
                      #   class-subjects, assignments, submissions) + AppShell
components/
├── ui/               # Reusable UI primitives
├── layout/           # AppShell (sidebar + header)
├── auth/             # AuthProvider / useAuth context
└── assignments, users, catalog, classSubjects  # Feature components
lib/
├── api.ts            # Fetch wrapper (tokens, envelope, errors, session expiry)
├── services.ts       # Typed API service layer
├── types.ts          # Domain types
├── useApi.ts         # Data-fetching hook
└── utils.ts          # Helpers
```

## Deployment

The app is deployed on [Render](https://render.com). Build command `npm run build`, start command `npm start`, and set `BACKEND_URL` in the environment. It can also be deployed to any Node.js host (Vercel, Railway, etc.).

## Related Repositories

- [assignment-management-server](https://github.com/mizanurrahman70/assignment-management-server) — Backend REST API
- [assignment-management-server-client](https://github.com/mizanurrahman70/assignment-management-server-client) — This frontend
