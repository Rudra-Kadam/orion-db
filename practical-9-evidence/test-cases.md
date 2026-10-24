# Comprehensive Test Cases Specification (Practical 9)

**Project:** Orion DB (Backend: NestJS 11 + Frontend: Next.js 16)  
**Execution Environment:** Jest 30 (Node.js) & Vitest 5.0.5 (V8)  
**Total Automated Test Scenarios:** 35 (24 Backend + 11 Frontend)  
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
*Summary: 35/35 Test Scenarios Verified via CLI Automation with 100% Pass Rate.*
