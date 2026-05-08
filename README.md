# Task Management Application

Full-stack task management app with email/password auth, task CRUD, and a responsive UI.

Publish: https://vivek-28-2006.github.io/Task-Management-Application/

## Tech Stack
- Client: React + Vite
- Server: Node.js + Express
- Database: JSON file storage (default) or PostgreSQL (optional)

## Setup

### 1) Server

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Database setup (JSON)

By default the API stores data in a local JSON file. You can override the path in `server/.env`:

```env
JSON_DB_PATH=./data/db.json
```

### Database setup (Postgres, optional)

Create a database and tables:

```sql
CREATE DATABASE task_manager;

\c task_manager

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
	id SERIAL PRIMARY KEY,
	owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	details TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'backlog',
	priority TEXT NOT NULL DEFAULT 'medium',
	due_date DATE,
	tags TEXT[] NOT NULL DEFAULT '{}',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Or run the script after setting `DATABASE_URL`:

```bash
cd server
npm run db:init
```

### 2) Client

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### 3) Use the app
- Client: http://localhost:5173
- API: http://localhost:5000/api

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Notes
- Update `DATABASE_URL` and `JWT_SECRET` in server `.env` before running.
