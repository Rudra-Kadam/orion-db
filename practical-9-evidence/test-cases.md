# Comprehensive Test Cases Specification (Practical 9 & Whole Project)

**Project:** Orion DB (Backend: NestJS 11 + Frontend: Next.js 16)  
**Execution Environment:** Jest 30 (Node.js) & Vitest 5.0.5 (V8)  
**Total Automated Test Scenarios:** 62 (41 Backend + 21 Frontend) across 16 Test Suites  
**Status:** 100% Passed (0 Failed, 0 Blocked)  

---

## Part 1: Backend Automated Test Scenarios (Jest + NestJS)

### Category: Authentication & User Credentials (AUTH)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **AUTH-01** | Positive | `email: "alex@orion.dev"`, `password: "StrongPassword123!"` | HTTP 200 OK, authentication cookies set, success message returned | HTTP 200, JWT tokens generated and cookies assigned | **PASS** |
| **AUTH-02** | Negative | `email: "unknown@orion.dev"`, `password: "ValidPassword123!"` | HTTP 401 Unauthorized, message: `"Invalid credentials"` | HTTP 401 UnauthorizedException with `"Invalid credentials"` | **PASS** |
| **AUTH-03** | Negative | `email: "alex@orion.dev"`, `password: "IncorrectPassword999"` | HTTP 401 Unauthorized, message: `"Invalid credentials"` | HTTP 401 UnauthorizedException with `"Invalid credentials"` | **PASS** |
| **AUTH-04** | Negative | Missing password: `{"email": "alex@orion.dev"}` | Validation Error (HTTP 400), constraint: `isString` on password | Validation failed: `"password must be a string"` | **PASS** |
| **AUTH-05** | Negative | Missing email: `{"password": "ValidPassword123!"}` | Validation Error (HTTP 400), constraint: `isEmail` on email | Validation failed: `"email must be an email"` | **PASS** |
| **AUTH-06** | Negative | Both credentials missing: `{}` | Validation Error (HTTP 400), multiple errors for email & password | Validation failed on both `"email"` and `"password"` | **PASS** |
| **AUTH-07** | Negative | Malformed email: `{"email": "not-a-valid-email-string"}` | Validation Error (HTTP 400), format constraint `isEmail` | Validation failed: `"email must be an email"` | **PASS** |
| **AUTH-08** | Negative | Short password in registration: `password: "short"` (< 8 chars) | Validation Error (HTTP 400), constraint `minLength: 8` | Validation failed: `"password must be longer than or equal to 8 characters"` | **PASS** |
| **AUTH-09** | Negative | Registration with duplicate email: `existing@orion.dev` | HTTP 409 Conflict, message: `"Email already in use"` | HTTP 409 ConflictException with `"Email already in use"` | **PASS** |

---

### Category: Route Protection & JWT Guard (GUARD)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **GUARD-01** | Negative | Unauthenticated request with empty cookies: `cookies: {}` | HTTP 401 Unauthorized, message: `"Not authenticated"` | HTTP 401 UnauthorizedException (`"Not authenticated"`) | **PASS** |
| **GUARD-02** | Negative | Expired or tampered JWT cookie: `access_token: "expired-or-tampered"` | HTTP 401 Unauthorized, message: `"Invalid or expired token"` | HTTP 401 UnauthorizedException (`"Invalid or expired token"`) | **PASS** |
| **GUARD-03** | Positive | Valid signed JWT access token in cookies | Access granted (`canActivate: true`), `request.user` populated | Returns `true`, attaches decoded `{sub, email}` payload | **PASS** |

---

### Category: Project API Key Guard (APIKEY)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **APIKEY-01** | Negative | Request missing `Authorization` header: `headers: {}` | HTTP 401 Unauthorized, message: `"Missing API key"` | HTTP 401 UnauthorizedException (`"Missing API key"`) | **PASS** |
| **APIKEY-02** | Negative | Malformed or invalid Bearer token: `Bearer corrupted.key` | HTTP 401 Unauthorized, message: `"Invalid API key"` | HTTP 401 UnauthorizedException (`"Invalid API key"`) | **PASS** |
| **APIKEY-03** | Positive | Valid Project API key (`role: "anon"`, `projectId: "proj_98765"`) | Access granted (`canActivate: true`), `request.projectKey` attached | Returns `true`, attaches decoded project payload | **PASS** |

---

### Category: Query Parser & SQL Injection Defense (QUERY)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **QUERY-01** | Positive | `select=id,name,email&status=eq.active&age=gte.18&order=created_at.desc&limit=50&offset=10` | Parsed structured query with select, filters, order, limit, offset | Returns ParsedQuery matching all parameters | **PASS** |
| **QUERY-02** | Negative | SQL injection in select column: `select="id, name; DROP TABLE users; --"` | HTTP 400 BadRequestException (`"Invalid select column"`) | Rejected with HTTP 400: `"Invalid select column"` | **PASS** |
| **QUERY-03** | Negative | SQL injection in filter column: `filter="admin_flag\" OR 1=1;--"` | HTTP 400 BadRequestException (`"Invalid filter column"`) | Rejected with HTTP 400: `"Invalid filter column"` | **PASS** |
| **QUERY-04** | Positive | SQL WHERE builder: filters with single quote in text | Safe escaped SQL statement with `''` sanitization | Returns safely quoted and escaped SQL WHERE clause | **PASS** |

---

### Category: SQL Editor Statement Guard (SQL)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **SQL-01** | Positive | Single valid SQL statement: `SELECT id, name FROM users;` | Normalized statement without trailing semicolons | Returns cleaned statement: `SELECT id, name FROM users` | **PASS** |
| **SQL-02** | Negative | Multi-statement injection attempt: `SELECT 1; DROP TABLE users;` | HTTP 400 BadRequestException (`"Only one SQL statement per run"`) | Rejected with HTTP 400: `"Only one SQL statement per run"` | **PASS** |
| **SQL-03** | Negative | Empty SQL statement: `"   ;   ;  "` | HTTP 400 BadRequestException (`"SQL query cannot be empty"`) | Rejected with HTTP 400: `"SQL query cannot be empty"` | **PASS** |
| **SQL-04** | Negative | Destructive command attempt: `DROP DATABASE orion_production` | Guard flags destructive statement (`isBlocked: true`) | Blocked as forbidden destructive statement | **PASS** |

---

### Category: System Health & Diagnostics (SYS)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **SYS-01** | Positive | `GET /health` | Status `"ok"` and current ISO timestamp | Returns `{ status: "ok", timestamp: "..." }` | **PASS** |

---

### Category: Organization Members & Role Policies (MEM)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **MEM-01** | Negative | Demoting the last admin in organization to developer | HTTP 400 BadRequestException (`"Cannot remove or demote the last admin..."`) | Rejected with HTTP 400: `"Cannot remove or demote the last admin of an organization"` | **PASS** |
| **MEM-02** | Negative | Removing the last admin in organization | HTTP 400 BadRequestException (`"Cannot remove or demote the last admin..."`) | Rejected with HTTP 400: `"Cannot remove or demote the last admin of an organization"` | **PASS** |
| **MEM-03** | Positive | Demoting an admin when a co-admin exists | Role successfully updated to developer | Returns updated member record with role="developer" | **PASS** |
| **MEM-04** | Negative | Updating role for non-existent member ID | HTTP 404 NotFoundException (`"Member not found"`) | Rejected with HTTP 404: `"Member not found"` | **PASS** |
| **MEM-05** | Positive | Removing member (soft delete with timestamp) | Member soft-deleted with confirmation message | Returns `{ message: "Member removed" }` | **PASS** |

---

### Category: Table Editor Service & Schema Security (TBL)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **TBL-01** | Positive | Valid table identifier: `"analytics_events_2026"` | Validation passes without exception | Verified as safe identifier | **PASS** |
| **TBL-02** | Negative | SQL injection attempt in table name: `"users; DROP TABLE audit_log; --"` | HTTP 400 BadRequestException (`"Invalid table name"`) | Rejected with HTTP 400: `"Invalid table name"` | **PASS** |
| **TBL-03** | Negative | Column identifier starting with digit: `"123_invalid_column"` | HTTP 400 BadRequestException (`"Invalid column name"`) | Rejected with HTTP 400: `"Invalid column name"` | **PASS** |
| **TBL-04** | Positive | PostgreSQL internal type mapping: `character varying`, `timestamp with time zone` | Mapped to Orion types: `"text"`, `"timestamp"`, `"uuid"`, `"integer"` | Accurately mapped to frontend types | **PASS** |
| **TBL-05** | Positive | Default value formatting: SQL functions (`now()`, `gen_random_uuid()`) vs strings | Functions preserved, string literals safely quoted and escaped | Safely escaped or preserved | **PASS** |

---

### Category: Projects Service & Provisioning (PROJ)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **PROJ-01** | Negative | Create project in non-existent organization: `orgSlug="missing-org"` | HTTP 404 NotFoundException (`"Organization not found"`) | Rejected with HTTP 404: `"Organization not found"` | **PASS** |
| **PROJ-02** | Negative | Query non-existent project: `projectSlug="non-existent-proj"` | HTTP 404 NotFoundException (`"Project not found"`) | Rejected with HTTP 404: `"Project not found"` | **PASS** |
| **PROJ-03** | Positive | Project slug generation: `"Alpha Core Analytics Engine!"` | Slugified name followed by 6 random hex characters | Matches `alpha-core-analytics-engine-[a-f0-9]{6}` | **PASS** |
| **PROJ-04** | Positive | Project API key signing: role `"anon"` and project ID | Signed JWT generated using `PROJECT_JWT_SECRET` | Valid JWT string signed with project payload | **PASS** |

---

### Category: Storage Buckets & Objects Service (STOR)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **STOR-01** | Negative | Storage query on non-existent project | HTTP 404 NotFoundException (`"Project not found"`) | Rejected with HTTP 404: `"Project not found"` | **PASS** |
| **STOR-02** | Negative | Create bucket with empty or whitespace name: `"    "` | HTTP 400 BadRequestException (`"Bucket name is required"`) | Rejected with HTTP 400: `"Bucket name is required"` | **PASS** |
| **STOR-03** | Negative | Save object in non-existent bucket ID | HTTP 404 NotFoundException (`"Bucket not found"`) | Rejected with HTTP 404: `"Bucket not found"` | **PASS** |

---

## Part 2: Frontend Automated Test Scenarios (Vitest + Next.js)

### Category: Frontend Cookie Parsing & Storage (WEB-AUTH)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **WEB-AUTH-01** | Positive | Raw `Set-Cookie` with all directives (`HttpOnly; Secure; SameSite=Lax; Max-Age=900; Path=/api`) | Parsed structured cookie object with all flags set | Parsed options match all directives | **PASS** |
| **WEB-AUTH-02** | Positive | Minimal `Set-Cookie` header (`refresh_token=refresh.val.123`) | Default options applied (`path: "/", sameSite: "lax"`, secure/httpOnly false) | Default options properly populated | **PASS** |
| **WEB-AUTH-03** | Positive | Constant check for Orion auth cookies (`access_token`, `refresh_token`, `session_random`) | Identifies auth cookies and ignores non-auth cookies | Accurately distinguishes auth cookies | **PASS** |

---

### Category: Client-side Zod Form Validation (WEB-VAL)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **WEB-VAL-01** | Positive | Valid login form: `email: "student@college.edu"`, `password: "Pass123!"` | Zod `safeParse: true` | Validation succeeds (`success = true`) | **PASS** |
| **WEB-VAL-02** | Negative | Malformed email in login: `email: "not-an-email"` | Zod `safeParse: false`, message: `"Invalid email"` | Validation rejected with `"Invalid email"` | **PASS** |
| **WEB-VAL-03** | Negative | Empty password in login: `password: ""` | Zod `safeParse: false`, message: `"Password is required"` | Validation rejected with `"Password is required"` | **PASS** |
| **WEB-VAL-04** | Negative | Password < 8 characters in register: `password: "short"` | Zod `safeParse: false`, message contains `"at least 8 characters"` | Validation rejected with minimum length error | **PASS** |
| **WEB-VAL-05** | Positive | Valid registration form data with name, email, password | Zod `safeParse: true` | Validation succeeds (`success = true`) | **PASS** |

---

### Category: Client-side Project & Org Validation (WEB-PROJ)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **WEB-PROJ-01** | Positive | Valid project name: `"Apollo Analytics Engine"` | Zod `safeParse: true` | Validation succeeds (`success = true`) | **PASS** |
| **WEB-PROJ-02** | Negative | Project name too short: `"A"` (1 character) | Zod `safeParse: false`, message: `"Name must be at least 2 characters"` | Validation rejected with minimum length error | **PASS** |
| **WEB-PROJ-03** | Negative | Project name exceeding limit: > 50 characters | Zod `safeParse: false`, message: `"Name must be at most 50 characters"` | Validation rejected with maximum length error | **PASS** |

---

### Category: UI Class Utility (WEB-UTIL)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **WEB-UTIL-01** | Positive | Merge static and truthy conditional classes | Classes merged cleanly into a single string | Returns `"rounded-md font-medium bg-blue-600 text-white text-base px-4"` | **PASS** |
| **WEB-UTIL-02** | Positive | Conflicting Tailwind classes (`p-4` vs `p-8`) | Later class overrides earlier conflicting class | Resolved cleanly to `"p-8 text-blue-500"` | **PASS** |
| **WEB-UTIL-03** | Positive | Falsy inputs (`null`, `undefined`, `false`, `0`) | Strips all falsy items without error | Returns `"btn-base active"` | **PASS** |

---

### Category: Table Editor Zod Schemas (WEB-TBL)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **WEB-TBL-01** | Positive | Valid table creation input with primary key column | Zod `safeParse: true` | Validation succeeds (`success = true`) | **PASS** |
| **WEB-TBL-02** | Negative | Table creation with empty columns list: `columns: []` | Zod `safeParse: false`, message: `"At least one column required"` | Validation rejected with minimum column constraint | **PASS** |
| **WEB-TBL-03** | Negative | Table creation with empty name: `name: ""` | Zod `safeParse: false`, message: `"Table name is required"` | Validation rejected with name required constraint | **PASS** |
| **WEB-TBL-04** | Negative | Add column with invalid identifier: `"123_invalid_col"` | Zod `safeParse: false`, message: `"Invalid column name"` | Validation rejected by identifier regex | **PASS** |
| **WEB-TBL-05** | Positive | Add column with valid numeric type | Zod `safeParse: true` | Validation succeeds (`success = true`) | **PASS** |

---

### Category: Frontend Middleware Proxy Route Protection (WEB-PROXY)

| Test ID | Type | Scenario / Input | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|:---:|
| **WEB-PROXY-01** | Negative | Unauthenticated request to `/dashboard` without cookies | Redirect (HTTP 307/302) to `/login` | Location header contains `/login` | **PASS** |
| **WEB-PROXY-02** | Positive | Authenticated user accessing `/login` with valid JWT token | Redirect (HTTP 307/302) to `/dashboard` | Location header contains `/dashboard` | **PASS** |

---

*Summary: 62/62 Test Scenarios across 16 Test Suites Verified via CLI Automation with 100% Pass Rate.*
