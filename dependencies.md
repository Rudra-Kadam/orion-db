# Project Dependencies

## Toolchain

- Node.js 20.9 or later (required by Next.js 16).
- pnpm 10.9.0 or later.
- Install workspace dependencies from the repository root with `pnpm install`.

The root `pnpm-lock.yaml` is the source of truth for resolved versions. Package manifests contain the full direct dependency lists.

## Workspace Packages

- `apps/api`: NestJS API, PostgreSQL access with Drizzle, realtime sockets, authentication, email, and file storage.
- `apps/web`: Next.js 16 web application using React 19, Tailwind CSS 4, and Radix UI.
- `packages/constants` and `packages/types`: shared internal workspace packages.
- `packages/orion-js`: Orion JavaScript SDK; uses Socket.IO and UploadThing.

## Key Direct Dependencies

### API (`apps/api`)

- NestJS: `@nestjs/common`, `@nestjs/config`, `@nestjs/core`, `@nestjs/jwt`, `@nestjs/platform-express`, `@nestjs/platform-socket.io`, `@nestjs/websockets`.
- Database: `@neondatabase/serverless`, `drizzle-orm`, `pg`.
- Authentication and validation: `bcrypt`, `class-transformer`, `class-validator`, `cookie-parser`.
- Realtime and storage: `socket.io`, `ws`, `uploadthing`.
- Email and utilities: `resend`, `dotenv`, `reflect-metadata`, `rxjs`, `slugify`.
- Internal: `@orion/constants`, `@orion/types`.

### Web (`apps/web`)

- Framework: `next`, `react`, `react-dom`.
- UI: `radix-ui`, `@radix-ui/react-scroll-area`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `react-resizable-panels`.
- Forms and data: `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-table`, `axios`.
- Editors, auth, realtime, and storage: `@monaco-editor/react`, `jose`, `socket.io-client`, `@uploadthing/react`, `uploadthing`.
- Internal: `@orion/constants`, `@orion/types`.

### JavaScript SDK (`packages/orion-js`)

- Runtime: `socket.io-client`, `uploadthing`.
- Internal: `@orion/constants`.

## Development Dependencies

- Root: `concurrently` for running the API and web app together.
- API: Nest CLI and testing packages, TypeScript and `ts-node` tooling, Drizzle Kit, Jest, ESLint, Prettier, and related type packages.
- Web: TypeScript, ESLint with Next.js configuration, Tailwind CSS 4, PostCSS, and the React Compiler Babel plugin.
- SDK: `tsdown` and TypeScript.

See `package.json`, `apps/api/package.json`, `apps/web/package.json`, and `packages/orion-js/package.json` for complete direct development dependencies and version ranges.

## External Services and Configuration

The following are not installed by pnpm and require service credentials or URLs:

- PostgreSQL/Neon: `DATABASE_URL` is required. `REALTIME_DATABASE_URL` can be provided for realtime database access; otherwise the API uses `DATABASE_URL`.
- API and web URLs: configure `API_URL`, `WEB_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_WEB_URL` for the environment. Local defaults are used in some browser-facing code.
- JWT and invitations: configure `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `INVITE_SECRET`, and `PROJECT_JWT_SECRET` as appropriate for the API. The web proxy also uses `JWT_ACCESS_SECRET`.
- OAuth: Google sign-in uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`; GitHub sign-in uses `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL`.
- Email: `RESEND_API_KEY` is needed for invitation and project-auth email.
- File storage: configure UploadThing credentials for the API's UploadThing integration.

Start both local applications with `pnpm dev` (Web on port 3000 and API on port 3001 by default to align with OAuth callback configurations).