# 🌌 Orion DB — Complete Project Architecture & Documentation

> **Orion DB** is a high-performance, open-source **Backend-as-a-Service (BaaS)** and Developer Platform inspired by Supabase and Firebase. It empowers developers to spin up isolated PostgreSQL backends in seconds with instant REST Data APIs, visual Table & SQL Editors, Multi-Tenant Authentication, Realtime WebSocket Channels, Object Storage, and an official JavaScript/TypeScript Client SDK.

---

## 📑 Table of Contents

1. [Executive Summary & What is Orion DB?](#-1-executive-summary--what-is-orion-db)
2. [High-Level Architecture & How It Works](#-2-high-level-architecture--how-it-works)
3. [Core Feature Breakdown](#-3-core-feature-breakdown)
4. [Complete Technology Stack](#-4-complete-technology-stack)
5. [Monorepo Architecture & Workspace Layout](#-5-monorepo-architecture--workspace-layout)
6. [Backend Deep Dive (`apps/api` — NestJS)](#-6-backend-deep-dive-appsapi--nestjs)
   - [Folder Structure](#appsapi-folder-structure)
   - [Module Responsibilities & Data Flow](#appsapi-modules-and-responsibilities)
7. [Frontend Deep Dive (`apps/web` — Next.js 16)](#-7-frontend-deep-dive-appsweb--nextjs-16)
   - [Folder Structure](#appsweb-folder-structure)
   - [Route Architecture & Features](#appsweb-routes-and-features)
   - [Proxy & Edge Middleware Security](#proxy--edge-middleware-security)
8. [Shared Packages Deep Dive (`packages/`)](#-8-shared-packages-deep-dive-packages)
   - [`@orion/constants`](#packagesconstants)
   - [`@orion/types`](#packagestypes)
   - [`orion-js` (Official Client SDK)](#packagesorion-js-official-sdk)
9. [Database Design & Multi-Tenancy Strategy](#-9-database-design--multi-tenancy-strategy)
10. [Environment Variables & Configuration Guide](#-10-environment-variables--configuration-guide)
11. [Local Development & Setup Guide](#-11-local-development--setup-guide)
12. [Troubleshooting & Pro Tips](#-12-troubleshooting--pro-tips)

---

## 🌟 1. Executive Summary & What is Orion DB?

Building production-grade applications requires databases, auth systems, real-time messaging, file storage, and APIs. Typically, teams configure PostgreSQL, deploy separate authentication services, manage object storage buckets, and build CRUD APIs from scratch.

**Orion DB solves this by providing a unified, self-hosted BaaS platform:**

* **⚡ Postgres Database per Project**: Portable, isolated database instances using dynamic schemas.
* **🛡️ Two-Tier Authentication**:
  1. *Platform Authentication*: For developers and team members managing the Orion dashboard (OAuth + JWT cookies).
  2. *Project Authentication*: Built-in auth for end-users of apps built on Orion (Email/Password, Magic Links, OAuth, and project JWTs).
* **🚀 Instant REST Data APIs**: Automatic CRUD REST endpoints generated for any table created in the visual schema editor.
* **⚡ Realtime WebSockets**: Pub/Sub socket infrastructure for building collaborative, multiplayer applications.
* **📁 Media & File Storage**: Upload, manage, and serve large files powered by UploadThing.
* **💻 Visual Database Studio**:
  - *Table Editor*: Visual table creation, column type configuration, and row management.
  - *SQL Editor*: Embedded Monaco Editor (VS Code engine) with syntax highlighting and query history.
* **📦 Official Client SDK (`orion-js`)**: Client-side library to query database tables, authenticate end-users, listen to real-time events, and upload files.

---

## 🏗️ 2. High-Level Architecture & How It Works

Orion DB is built as a **Turborepo/pnpm monorepo** consisting of two primary applications and three shared internal packages:

```
                                  ┌──────────────────────────────┐
                                  │      Client Applications     │
                                  │  (Web Browser / Mobile App)  │
                                  └──────────────┬───────────────┘
                                                 │
                         ┌───────────────────────┴───────────────────────┐
                         │                                               │
                         ▼                                               ▼
              ┌─────────────────────┐                         ┌─────────────────────┐
              │   Orion Dashboard   │                         │  External Apps with │
              │   (apps/web: Next)  │                         │  `orion-js` SDK     │
              └──────────┬──────────┘                         └──────────┬──────────┘
                         │                                               │
                         │ HTTP (Cookies / Proxy)                        │ REST / WS (API Keys)
                         ▼                                               ▼
              ┌─────────────────────────────────────────────────────────────────────┐
              │                       Orion API (apps/api: NestJS)                  │
              │                                                                     │
              │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
              │  │  Auth/OAuth  │  │ Project Auth │  │ Table Editor │  │ Realtime │ │
              │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘ │
              │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
              │  │  SQL Editor  │  │ Project REST │  │ File Storage │  │ Members  │ │
              │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘ │
              └──────────────────────────────────┬──────────────────────────────────┘
                                                 │
                                                 │ Drizzle ORM / pg / WebSockets
                                                 ▼
              ┌─────────────────────────────────────────────────────────────────────┐
              │                     PostgreSQL Database (Neon / PG)                 │
              │                                                                     │
              │  ┌──────────────────────────────┐ ┌──────────────────────────────┐  │
              │  │    public (Platform Schema)  │ │   project_{slug} (Tenant)    │  │
              │  │  Users, Orgs, Projects, Keys │ │   Tables created by users    │  │
              │  └──────────────────────────────┘ └──────────────────────────────┘  │
              └─────────────────────────────────────────────────────────────────────┘
```

### Request Flow Explained

1. **Dashboard Interactions**:
   - The user opens `apps/web` (Next.js 16).
   - Next.js edge proxy (`src/proxy.ts`) validates session tokens stored in HttpOnly cookies. If an access token expires, it silently issues a refresh token request to the NestJS API.
   - The dashboard interacts with `apps/api` via REST for managing organizations, inviting members, executing SQL queries, and creating tables.

2. **Project Data & SDK Flow**:
   - Third-party apps install `orion-js`.
   - The developer initializes the client with `projectUrl` and `anonKey`.
   - Requests are routed to `apps/api/src/project-api`, guarded by `ProjectKeyGuard`.
   - Dynamic SQL queries are generated, validated, and executed against the project's isolated PostgreSQL schema (`project_{slug}`).

3. **Realtime Updates Flow**:
   - Clients connect via Socket.IO/WebSockets to `apps/api/src/realtime`.
   - Clients subscribe to channel rooms (e.g. table changes).
   - Database mutation events trigger notifications that are broadcast to subscribed socket clients.

---

## 🎯 3. Core Feature Breakdown

| Feature | Description | Implementation Details |
| :--- | :--- | :--- |
| **Organizations & Teams** | Multi-tenant organization workspace hierarchy. | Role-Based Access Control (`admin`, `developer`), email invites with expiration. |
| **Project Management** | Dynamic project creation with dedicated schemas and keys. | Automatic generation of `anonKey` and `serviceRoleKey`, slug generation via `slugify`. |
| **Visual Table Editor** | View, create, and modify database tables without writing SQL. | Supports `text`, `integer`, `bigint`, `boolean`, `timestamp`, `uuid`, `jsonb`, and `numeric`. |
| **Interactive SQL Editor** | Execute raw PostgreSQL queries directly from the dashboard. | Embedded Monaco Editor, schema autocompletion, execution history logging. |
| **Auto-generated REST APIs** | Immediate REST APIs for every table created. | Query parser supporting `select`, `order`, `limit`, `offset`, and operators (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `is`). |
| **Platform Authentication** | Secure developer login for Orion dashboard. | Email/Password with `bcrypt`, Google OAuth, GitHub OAuth, JWT access/refresh tokens in HttpOnly cookies. |
| **Project Authentication** | Auth system for applications built *on top* of Orion. | End-user signups, logins, magic link passwordless login via Resend, and session tokens. |
| **Realtime WebSockets** | Live event streaming and reactive updates. | Socket.IO gateway with channel subscription/unsubscription protocols. |
| **Object Storage** | Upload and serve files, images, and documents. | UploadThing backend endpoints with bucket and object tracking tables. |
| **Client SDK (`orion-js`)** | Official JavaScript/TypeScript SDK for web, Node, and mobile apps. | Modular interface providing `.from(table)`, `.auth`, `.realtime`, and `.storage`. |

---

## 🛠️ 4. Complete Technology Stack

### Backend Stack (`apps/api`)
- **Framework**: [NestJS 11](https://nestjs.com/) (Modular, enterprise TypeScript architecture)
- **Runtime**: Node.js 20.9+
- **Database & ORM**:
  - [PostgreSQL](https://www.postgresql.org/) / [Neon Serverless Postgres](https://neon.tech/)
  - [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit` for type-safe schema definitions and migrations
  - Native `pg` driver for connection pooling and dynamic schema queries
- **Realtime**: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `ws`
- **Security & Auth**:
  - `@nestjs/jwt`, `bcrypt` for password hashing
  - `cookie-parser` for HttpOnly session management
  - `class-validator` & `class-transformer` for DTO validation
- **External Integrations**:
  - [Resend](https://resend.com/) for transactional email (member invites and magic links)
  - [UploadThing](https://uploadthing.com/) for file storage pipelines
- **Utilities**: `slugify`, `rxjs`, `dotenv`

### Frontend Stack (`apps/web`)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React Server Components)
- **Core Library**: [React 19](https://react.dev/)
- **Styling**:
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - Custom glassmorphic tokens, CSS variables, and OKLCH color palettes
  - `tw-animate-css` for micro-interactions
- **UI Components & Icons**:
  - [Radix UI](https://www.radix-ui.com/) primitives (dialogs, dropdowns, scroll areas, tooltips)
  - [Lucide React](https://lucide.dev/) for iconography
  - `react-resizable-panels` for IDE/Studio split panes
- **Forms & Data Tables**:
  - `react-hook-form` with `@hookform/resolvers` & [Zod](https://zod.dev/)
  - [TanStack Table v8](https://tanstack.com/table) for tabular data grids
- **Code & Query Editing**:
  - `@monaco-editor/react` (Visual Studio Code editor in browser)
- **Networking & Auth**:
  - `axios` & native `fetch`
  - `jose` for edge JWT verification in middleware
  - `socket.io-client` for live WebSocket connectivity

### Monorepo & Development Tooling
- **Package Manager**: [pnpm](https://pnpm.io/) (Fast, disk-efficient workspace management)
- **Task Runner**: `concurrently` (Run frontend & backend simultaneously)
- **SDK Bundler**: `tsdown` (Fast TypeScript library bundler for `packages/orion-js`)
- **Quality & Formatting**: TypeScript 5, ESLint 9, Prettier

---

## 📁 5. Monorepo Architecture & Workspace Layout

```
orion-db/
├── apps/
│   ├── api/                     # NestJS Backend API (port 3001)
│   └── web/                     # Next.js 16 Web Dashboard (port 3000)
├── packages/
│   ├── constants/               # Shared constants (roles, cookies, types)
│   ├── types/                   # Shared TypeScript interfaces & DTOs
│   └── orion-js/                # Official JavaScript/TypeScript SDK
├── dependencies.md              # Dependency reference & versions
├── README.md                    # Main Project Documentation
├── package.json                 # Monorepo root scripts (`dev`, `dev:api`, `dev:web`)
├── pnpm-workspace.yaml          # pnpm workspace configuration
└── pnpm-lock.yaml               # Resolved lockfile
```

---

## ⚙️ 6. Backend Deep Dive (`apps/api` — NestJS)

### `apps/api` Folder Structure

```
apps/api/src/
├── app.controller.ts            # Root health check endpoint
├── app.module.ts                # Main application module registering all submodules
├── app.service.ts               # Root service
├── main.ts                      # NestJS bootstrap, CORS, cookie parser, validation pipe
├── auth/                        # Platform authentication (JWT, Login, Register, OAuth)
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── dto/                     # Auth DTOs
│   ├── guards/                  # JwtAuthGuard, RefreshTokenGuard
│   └── strategies/              # Passport/JWT strategies, OAuth callbacks
├── db/                          # Database connection and Drizzle schema
│   ├── db.module.ts
│   ├── drizzle.service.ts       # Drizzle client instantiation
│   └── schema/                  # PostgreSQL table definitions
│       ├── index.ts
│       ├── organizations.ts     # Organizations & Members tables
│       ├── projects.ts          # Projects table (schemas, API keys)
│       ├── users.ts             # Platform Users table
│       ├── query-history.ts     # SQL editor query logs
│       ├── storage-buckets.ts   # File storage buckets
│       └── storage-objects.ts   # File storage object records
├── members/                     # Organization team members & invite system
├── orgs/                        # Organization CRUD & slug generation
├── projects/                    # Project provisioning, keys generation, schema setup
├── project-api/                 # Dynamic REST API for project tables
│   ├── project-api.controller.ts# Endpoints: GET/POST/PATCH/DELETE /:projectSlug/:table
│   ├── project-api.service.ts   # Dynamic SQL builder & executor
│   ├── project-key.guard.ts     # Validates `anonKey` / `serviceRoleKey`
│   └── query-parser.ts          # Parses SQL filter params from URL
├── project-auth/                # End-user authentication for user projects
│   ├── project-auth.controller.ts
│   ├── project-auth.service.ts
│   └── dto/
├── realtime/                    # WebSocket Gateway for realtime events
│   ├── realtime.gateway.ts      # Socket.IO connection & event handlers
│   └── realtime.module.ts
├── sql-editor/                  # Arbitrary SQL query execution engine
│   ├── sql-editor.controller.ts
│   ├── sql-editor.service.ts
│   └── dto/
├── storage/                     # File upload & UploadThing integration
│   ├── storage.controller.ts
│   └── storage.service.ts
└── table-editor/                # Visual Table Schema management
    ├── table-editor.controller.ts
    ├── table-editor.service.ts
    └── dto/
```

### `apps/api` Modules and Responsibilities

1. **`AuthModule`**:
   - Manages developer authentication for Orion.
   - Signs and verifies short-lived JWT access tokens (15m) and long-lived refresh tokens (7d).
   - Sets secure `HttpOnly`, `SameSite` cookies to prevent XSS credential theft.
   - Handles Google and GitHub OAuth callback handshakes.

2. **`ProjectsModule`**:
   - Generates unique project slugs and cryptographic API keys (`anon` key and `service_role` key).
   - Initializes a dedicated PostgreSQL schema (`CREATE SCHEMA project_{slug}`) when a project is created, ensuring complete multi-tenant database isolation.

3. **`TableEditorModule`**:
   - Runs DDL statements (`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`).
   - Inspects `information_schema.columns` and `information_schema.tables` to return table schemas and column types to the UI.

4. **`ProjectApiModule`**:
   - Accepts requests from developers and apps using `orion-js`.
   - Validates `apikey` headers using `ProjectKeyGuard`.
   - Uses `QueryParser` to safely convert query strings like `?age=gte.18&status=eq.active&select=id,name` into parameterized SQL queries preventing SQL injection.

5. **`SqlEditorModule`**:
   - Executes arbitrary SQL for the web dashboard's Monaco Editor.
   - Logs query history in `query_history` with execution durations and timestamps.

6. **`RealtimeModule`**:
   - Provides a WebSocket gateway using `@nestjs/platform-socket.io`.
   - Handles room subscription (`subscribe`) and broadcasts mutation payloads to clients listening on specific channels.

7. **`StorageModule`**:
   - Handles storage bucket creation, access policies, and object tracking.
   - Communicates with UploadThing for direct client-to-cloud file uploads.

---

## 💻 7. Frontend Deep Dive (`apps/web` — Next.js 16)

### `apps/web` Folder Structure

```
apps/web/src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root HTML layout with Geist font
│   ├── globals.css              # Tailwind v4 theme, OKLCH color tokens, animations
│   ├── page.tsx                 # High-converting Landing Page (Hero, Features, CTAs)
│   ├── login/                   # Developer Login Page
│   ├── register/                # Developer Registration Page
│   └── (dashboard)/             # Protected Route Group
│       ├── layout.tsx           # Dashboard shell with AppSidebar & TopNav
│       ├── organizations/       # Organization & Project management
│       │   ├── new/             # Create organization
│       │   └── [slug]/          # Organization detail
│       │       ├── projects/    # Project list
│       │       ├── settings/    # Organization settings & member management
│       │       └── [projectSlug]/ # Specific Project Studio
│       │           ├── database/# Visual Table Editor & schema inspector
│       │           ├── sql/     # Monaco SQL Editor & query runner
│       │           ├── auth/    # End-user project auth management & users
│       │           ├── storage/ # Storage buckets & file manager
│       │           ├── realtime/# WebSocket subscription tester
│       │           └── api/     # Auto-generated API documentation
│       └── settings/            # Personal user account settings
├── components/                  # Shared UI components
│   ├── app-sidebar.tsx          # Multi-level collateral navigation bar
│   ├── top-nav.tsx              # Breadcrumbs, project switcher, user avatar menu
│   └── ui/                      # Radix UI wrappers (Button, Dialog, Dropdown, Table, Input)
├── features/                    # Domain-driven feature modules
│   ├── api-docs/                # Interactive API documentation generator
│   ├── auth/                    # Client auth forms, cookie utilities, OAuth buttons
│   ├── members/                 # Member invitation dialogs & role switches
│   ├── organization/            # Org creation modals & cards
│   ├── project-auth/            # User auth provider configuration
│   ├── projects/                # Project cards, creation flow, credentials display
│   ├── realtime/                # Realtime inspector UI
│   ├── sql-editor/              # Monaco editor component & execution logs
│   ├── storage/                 # Upload dropzone, file list, bucket viewer
│   └── table-editor/            # Data table grid, column modifier, row editor
├── hooks/                       # Custom React hooks (useAuth, useProject, useRealtime)
├── lib/                         # Axios client, utilities (`cn`), formatters
├── proxy.ts                     # Next.js Edge Auth Middleware (Token verification & refresh)
└── server-utils/                # Server-side data fetching helpers
```

### `apps/web` Routes and Features

* **Landing Page (`src/app/page.tsx`)**:
  - Features modern micro-animations, glowing hover effects, SVG logo rotation, and interactive feature cards.
  - Links to authentication and documentation.
* **Database Studio (`/organizations/[slug]/[projectSlug]/database`)**:
  - Full spreadsheet-like table interface using `@tanstack/react-table`.
  - Add columns, filter rows, paginate, and edit data in place.
* **SQL Studio (`/organizations/[slug]/[projectSlug]/sql`)**:
  - Monaco Editor supporting SQL auto-completion, line numbers, and dark mode.
  - Query execution statistics (run time, row count) and execution history drawer.
* **API Documentation (`/organizations/[slug]/[projectSlug]/api`)**:
  - Automatically reads the project's schema and displays copy-pasteable JavaScript (`orion-js`), cURL, and REST snippets for each table.

### Proxy & Edge Middleware Security

The Next.js proxy in [proxy.ts](file:///c:/Users/ASUS/Desktop/awt_proj/orion-db/apps/web/src/proxy.ts) guards all application routes:
- **Token Verification**: Uses `jose` to verify JWT access tokens locally at the edge without querying the database.
- **Silent Refresh**: If an access token expires but a refresh token exists, it calls the backend `/auth/refresh` endpoint seamlessly, updating cookies without interrupting the user.
- **Route Redirection**: Prevents unauthenticated access to `/dashboard` or `/organizations`, and redirects logged-in users away from `/login` and `/register`.

---

## 📦 8. Shared Packages Deep Dive (`packages/`)

### `packages/constants`
Contains global constants shared across backend, frontend, and SDK:
- `COOKIE_KEYS`: `access_token`, `refresh_token`
- `ORG_ROLES`: `admin`, `developer`
- `PROJECT_KEY_ROLES`: `anon`, `service_role`
- `COLUMN_TYPES`: `text`, `integer`, `bigint`, `boolean`, `timestamp`, `uuid`, `jsonb`, `numeric`
- `FILTER_OPERATORS`: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `is`
- `REALTIME_EVENTS`: `subscribe`, `unsubscribe`, `event`, `error`

### `packages/types`
Type definitions providing end-to-end type safety:
- `User`, `Organization`, `Project`, `OrgMember`
- `TableDefinition`, `ColumnDefinition`, `QueryResult`
- Auth DTOs: `RegisterInput`, `LoginInput`, `AuthTokens`, `JwtPayload`

### `packages/orion-js` (Official SDK)
The client library developers install to use Orion in their own frontend/backend applications:

```typescript
import { OrionClient } from 'orion-js';

// Initialize client
const orion = new OrionClient('http://localhost:3000/api', 'YOUR_ANON_KEY');

// 1. Query Database Table
const { data, error } = await orion
  .from('posts')
  .select('id, title, author')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10);

// 2. Realtime WebSocket Subscription
const channel = orion.realtime.channel('posts-room');
channel.on('INSERT', (newPost) => {
  console.log('New post received:', newPost);
});
channel.subscribe();

// 3. User Authentication
const { user, token } = await orion.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!',
});

// 4. File Storage Upload
const uploadResult = await orion.storage.from('avatars').upload(file);
```

---

## 🗄️ 9. Database Design & Multi-Tenancy Strategy

Orion DB employs a **Schema-based Multi-Tenancy Architecture** on PostgreSQL.

### 1. Platform Schema (`public`)
Stores metadata about the Orion platform itself:
- `users`: Developer accounts, password hashes, avatars.
- `organizations`: Teams and workspaces.
- `organization_members`: Users linked to organizations with roles (`admin` or `developer`).
- `projects`: Projects created under organizations. Stores the project's generated API keys (`anonKey`, `serviceRoleKey`) and assigned `dbSchema`.
- `query_history`: User SQL query logs for the Monaco Editor.
- `storage_buckets` & `storage_objects`: Bucket metadata and uploaded file references.

### 2. Tenant Schemas (`project_{slug}`)
When a project is created, Orion executes:
```sql
CREATE SCHEMA IF NOT EXISTS "project_my_app";
```
Every table created by the user in the Table Editor or SQL Editor lives inside their schema:
- `project_my_app.users`
- `project_my_app.posts`
- `project_my_app.orders`

**Why this design?**
1. **Security**: Data from different projects is physically isolated in separate PostgreSQL namespaces.
2. **Performance**: Table names don't conflict; queries execute directly against clean schema paths.
3. **Portability**: A project's schema can easily be dumped (`pg_dump -n project_my_app`) and migrated to an external database at any time.

---

## ⚙️ 10. Environment Variables & Configuration Guide

### API Environment (`apps/api/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Port for the NestJS API server | `3001` |
| `API_URL` | Base public URL of the API | `http://localhost:3001/api` |
| `WEB_URL` | Frontend URL allowed by CORS | `http://localhost:3000` |
| `DATABASE_URL` | Primary PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `REALTIME_DATABASE_URL` | Database connection for realtime listener (optional) | Same as `DATABASE_URL` |
| `JWT_ACCESS_SECRET` | Secret key for signing access JWTs | Random 32+ character string |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh JWTs | Random 32+ character string |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token lifespan | `7d` |
| `INVITE_SECRET` | Secret for organization invitation tokens | Random 32+ character string |
| `PROJECT_JWT_SECRET` | Secret for signing end-user project JWTs | Random 32+ character string |
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_123456...` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Secret from Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | `http://localhost:3001/api/auth/google/callback` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Client ID from GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | Secret from GitHub Developer Settings |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback URL | `http://localhost:3001/api/auth/github/callback` |
| `UPLOADTHING_TOKEN` | UploadThing API token for storage | `ut_token_...` |

### Web Environment (`apps/web/.env.local`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Next.js port | `3000` |
| `API_URL` | Server-to-server API URL for middleware & SSR | `http://localhost:3001/api` |
| `NEXT_PUBLIC_API_URL` | Client-accessible API URL | `http://localhost:3001/api` |
| `NEXT_PUBLIC_WEB_URL` | Public frontend URL | `http://localhost:3000` |
| `JWT_ACCESS_SECRET` | Must match API secret for edge token verification | Same as API `JWT_ACCESS_SECRET` |

---

## 🚀 11. Local Development & Setup Guide

### Prerequisites
- **Node.js**: v20.9.0 or higher
- **pnpm**: v10.9.0 or higher (`npm install -g pnpm`)
- **PostgreSQL Database**: Local PostgreSQL instance or a free [Neon](https://neon.tech) cloud database

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/Tirth678/orion-db.git
cd orion-db
pnpm install
```

### Step 2: Configure Environment Variables
1. Copy `.env.example` in `apps/api`:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Fill in your `DATABASE_URL` and secrets.

2. Copy `.env.example` in `apps/web`:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   Ensure `JWT_ACCESS_SECRET` matches the one in `apps/api/.env`.

### Step 3: Run Database Migrations
```bash
pnpm --filter api db:push
```

### Step 4: Start Development Servers
You can start both frontend and backend concurrently from the root:
```bash
pnpm dev
```
Or start them individually in separate terminals:
```bash
# Terminal 1: NestJS API (runs on http://localhost:3001)
pnpm run dev:api

# Terminal 2: Next.js Frontend (runs on http://localhost:3000)
pnpm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💡 12. Troubleshooting & Pro Tips

### 1. `pnpm run start` vs `pnpm run dev`
* **Development (`pnpm run dev`)**: Next.js runs in development mode with Turbopack and **Hot Module Replacement (HMR)**. Any CSS changes, animations, or component edits in `src/app` appear immediately in the browser.
* **Production (`pnpm run start`)**: Serves an **already compiled static build** from `.next`. If you edit code and run `start` without running `pnpm run build` first, your changes will **not** appear!

### 2. Port Alignment
* The standard configuration places the **Web dashboard on port 3000** and the **NestJS API on port 3001**.
* If Google/GitHub OAuth redirects fail, verify that the Authorized Redirect URIs in your Google Cloud or GitHub OAuth app settings match `http://localhost:3001/api/auth/google/callback` and `http://localhost:3001/api/auth/github/callback`.

### 3. Database Schema Push
If you modify Drizzle schema files in `apps/api/src/db/schema/`:
```bash
# Push schema changes directly to PostgreSQL
pnpm --filter api db:push

# Launch Drizzle Studio GUI to inspect tables
pnpm --filter api db:studio
```

---

<div align="center">
  <sub>Built with ❤️ for developers who love PostgreSQL, Next.js, and NestJS.</sub>
</div>
