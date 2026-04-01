# TaskFlow - Task Management System

A full-stack Task Management System built as part of the **Track A: Full-Stack Engineer** assessment. Users can register, log in, and perform full CRUD management of their personal tasks.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|--------------------------------------------------|
| Frontend   | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend    | Node.js, Express 5, TypeScript                   |
| Database   | SQLite (via Prisma ORM)                          |
| Auth       | JWT (Access + Refresh Tokens), bcrypt            |
| Validation | Zod                                              |

---

## Project Architecture

```
Kunal_Project/
├── backend/                          # REST API Server (Port 4000)
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (User + Task models)
│   │   └── migrations/               # SQL migration files
│   ├── src/
│   │   ├── index.ts                  # Express app entry point
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── routes/
│   │   │   ├── auth.ts               # Auth endpoints (register/login/refresh/logout)
│   │   │   └── tasks.ts              # Task CRUD endpoints with pagination/filtering
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT authentication middleware
│   │   │   └── validate.ts           # Zod request body validation middleware
│   │   └── utils/
│   │       └── jwt.ts                # Token generation & verification helpers
│   ├── .env                          # Environment variables
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                         # Next.js Web App (Port 3000)
│   ├── app/
│   │   ├── layout.tsx                # Root layout (AuthProvider + Toast)
│   │   ├── page.tsx                  # Home — redirects to /dashboard or /login
│   │   ├── login/page.tsx            # Login page
│   │   ├── register/page.tsx         # Registration page
│   │   └── dashboard/page.tsx        # Main dashboard (task list + CRUD)
│   ├── components/
│   │   ├── TaskCard.tsx              # Individual task card component
│   │   ├── TaskModal.tsx             # Create/Edit task modal
│   │   └── Toast.tsx                 # Toast notification system
│   ├── contexts/
│   │   └── AuthContext.tsx           # Auth state management + token handling
│   ├── lib/
│   │   └── api.ts                    # API client with auto token refresh
│   ├── tsconfig.json
│   └── package.json
│
├── .nvmrc                            # Node.js version (22)
└── README.md
```

---

## Database Schema

### User
| Field        | Type     | Description                     |
|-------------|----------|---------------------------------|
| id          | String   | UUID primary key                |
| email       | String   | Unique email address            |
| name        | String   | User's display name             |
| password    | String   | bcrypt-hashed password          |
| refreshToken| String?  | Current valid refresh token     |
| createdAt   | DateTime | Account creation timestamp      |
| updatedAt   | DateTime | Last update timestamp           |

### Task
| Field       | Type     | Description                                  |
|------------|----------|----------------------------------------------|
| id         | String   | UUID primary key                             |
| title      | String   | Task title                                   |
| description| String?  | Optional task description                    |
| status     | String   | `pending` / `in_progress` / `completed`      |
| userId     | String   | Foreign key to User (cascade delete)         |
| createdAt  | DateTime | Task creation timestamp                      |
| updatedAt  | DateTime | Last update timestamp                        |

---

## API Endpoints

### Authentication

| Method | Endpoint         | Description                          | Auth Required |
|--------|-----------------|--------------------------------------|:------------:|
| POST   | `/auth/register` | Register a new user                  | No           |
| POST   | `/auth/login`    | Login and receive tokens             | No           |
| POST   | `/auth/refresh`  | Get new access token using refresh token | No       |
| POST   | `/auth/logout`   | Invalidate refresh token             | Yes          |

### Tasks (all require authentication)

| Method | Endpoint             | Description                                      |
|--------|---------------------|--------------------------------------------------|
| GET    | `/tasks`            | List tasks (supports `?page`, `?limit`, `?status`, `?search`) |
| POST   | `/tasks`            | Create a new task                                |
| GET    | `/tasks/:id`        | Get a single task by ID                          |
| PATCH  | `/tasks/:id`        | Update a task (title, description, status)       |
| DELETE | `/tasks/:id`        | Delete a task                                    |
| PATCH  | `/tasks/:id/toggle` | Toggle task between `pending` and `completed`    |

---

## Security Implementation

- **Password Hashing**: All passwords are hashed with `bcrypt` (10 salt rounds) before storage.
- **JWT Authentication**:
  - **Access Token**: Short-lived (15 minutes), sent in `Authorization: Bearer <token>` header.
  - **Refresh Token**: Long-lived (7 days), stored in the database and used to obtain new access tokens.
- **Route Protection**: The `authenticate` middleware verifies the access token on all protected routes.
- **Token Refresh**: The frontend automatically refreshes expired access tokens using the refresh token, ensuring seamless user sessions.
- **Data Isolation**: Users can only access and modify their own tasks (enforced at the query level via `userId` filtering).
- **Input Validation**: All request bodies are validated using Zod schemas, returning 400 errors with detailed field-level messages.

---

## Frontend Features

- **Authentication Pages**: Login and Registration with form validation and error handling.
- **Task Dashboard**:
  - Stats cards showing Total, Pending, In Progress, and Completed task counts.
  - Visual progress bar showing overall completion percentage.
  - Responsive grid layout (1/2/3 columns based on screen size).
- **Filtering & Searching**:
  - Filter by status via pill buttons (All / Pending / In Progress / Completed).
  - Real-time search by title with 300ms debounce.
- **CRUD Operations**:
  - Create and Edit tasks via a modal form.
  - Delete tasks with confirmation dialog.
  - Toggle task completion with a single click.
- **Pagination**: Page-based navigation for large task lists.
- **Toast Notifications**: Success/error feedback for all operations.
- **Auto Token Refresh**: Transparent token refresh when access tokens expire.
- **Responsive Design**: Fully responsive UI that works on desktop, tablet, and mobile.

---

## Prerequisites

- **Node.js** >= 22 (use `nvm use` — `.nvmrc` is included)
- **npm**

---

## Setup & Run Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd Kunal_Project
```

### 2. Set up Node.js version
```bash
nvm install 22
nvm use 22
```

### 3. Start the Backend

```bash
cd backend
npm install
npx prisma migrate dev        # Creates the SQLite database and applies schema
npm run dev                    # Starts the API server on http://localhost:4000
```

### 4. Start the Frontend (in a new terminal)

```bash
cd frontend
npm install
npm run dev                    # Starts the Next.js app on http://localhost:3000
```

### 5. Open the app

Navigate to **http://localhost:3000** in your browser.

---

## Environment Variables

The backend uses a `.env` file with the following variables:

| Variable             | Default Value                              | Description                  |
|---------------------|--------------------------------------------|------------------------------|
| `DATABASE_URL`      | `file:./dev.db`                            | SQLite database file path    |
| `ACCESS_TOKEN_SECRET` | `your-access-token-secret-change-in-production` | JWT access token secret |
| `REFRESH_TOKEN_SECRET`| `your-refresh-token-secret-change-in-production`| JWT refresh token secret|
| `ACCESS_TOKEN_EXPIRY` | `15m`                                     | Access token expiration time |
| `REFRESH_TOKEN_EXPIRY`| `7d`                                      | Refresh token expiration time|
| `PORT`              | `4000`                                     | API server port              |

---

## Error Handling

The API returns consistent error responses with appropriate HTTP status codes:

| Status Code | Usage                                    |
|:-----------:|------------------------------------------|
| 400         | Validation errors (invalid input)        |
| 401         | Unauthorized (invalid/expired token)     |
| 404         | Resource not found                       |
| 201         | Resource created successfully            |
| 200         | Successful operation                     |
