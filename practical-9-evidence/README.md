# AWT Practical 9: CLI-Based Automated Testing

**Course:** Advanced Web Technology (AWT) — College Practical 9  
**Repository:** Orion DB  
**Candidate Workspace:** `c:\Users\ASUS\Desktop\awt_proj\orion-db`  

---

## 1. Project Overview & Stack

Orion DB is an open-source, modern cloud database console and developer platform built with:
* **Frontend:** Next.js 16 + React 19 + Tailwind CSS + Zod
* **Backend:** NestJS 11 + Express + TypeScript
* **Database & ORM:** Neon Serverless PostgreSQL + Drizzle ORM
* **Package Manager:** `pnpm` Monorepo Workspaces

Practical 9 implements **actual automated test execution** with granular, formatted CLI output directly in the terminal, verifying critical paths across both backend and frontend without relying on synthetic or simulated results.

---

## 2. Directory Structure of Practical 9 Evidence

```
practical-9-evidence/
├── README.md                          # Master overview and practical index (This document)
├── test-plan.md                       # Comprehensive testing strategy and scope
├── test-cases.md                      # Detailed specification of all 35 test cases
├── execution-summary.md               # Summary metrics, CLI commands, and coverage breakdown
├── complexity/
│   └── cyclomatic-complexity.md       # McCabe's Cyclomatic Complexity calculations for real functions
├── coverage/
│   ├── backend/                       # Full Istanbul coverage reports from Jest
│   └── frontend/                      # Full V8 coverage reports from Vitest
├── logs/
│   ├── backend-test-execution.log     # Raw terminal log of Jest test execution
│   ├── backend-coverage.log           # Raw terminal log of Jest coverage run
│   ├── frontend-test-execution.log    # Raw terminal log of Vitest test execution
│   └── frontend-coverage.log          # Raw terminal log of Vitest coverage run
└── screenshots/                       # Terminal and application evidence captures
```

---

## 3. How to Run the Automated Tests

### 3.1 Backend Test Execution (Jest)
To run all 24 backend automated tests with formatted CLI feedback:
```powershell
pnpm --filter api test
```

To run with full code coverage metrics:
```powershell
pnpm --filter api test:cov
```

### 3.2 Frontend Test Execution (Vitest)
To run all 11 frontend automated tests:
```powershell
pnpm --filter web test
```

To run with frontend code coverage metrics:
```powershell
pnpm --filter web test:cov
```

---

## 4. Required Output Format Demonstrated

Every single test case outputs a structured, human-readable terminal line containing the exact Test ID, Test Name, Scenario/Input, Expected Outcome, and Actual Outcome:

```
PASS | AUTH-01 | Valid credentials login | Input: email=alex@orion.dev, password=****** | Expected: HTTP 200 OK & Logged in successfully with cookies set | Actual: message=Logged in successfully, tokens generated & setTokenCookies invoked
PASS | AUTH-02 | Non-existent email login | Input: email=unknown@orion.dev, password=****** | Expected: HTTP 401 Unauthorized with message "Invalid credentials" | Actual: HTTP 401 Unauthorized, message=Invalid credentials
PASS | AUTH-03 | Incorrect password login | Input: email=alex@orion.dev, password=incorrect | Expected: HTTP 401 Unauthorized with message "Invalid credentials" | Actual: HTTP 401 Unauthorized, message=Invalid credentials
PASS | AUTH-04 | Missing password validation | Input: {"email":"alex@orion.dev"} | Expected: Validation error: password must be a string | Actual: Validation error detected on property: password
PASS | AUTH-05 | Missing email validation | Input: {"password":"ValidPassword123!"} | Expected: Validation error: email must be an email | Actual: Validation error detected on property: email
PASS | AUTH-06 | Empty credentials validation | Input: {} (empty payload) | Expected: Validation errors on both "email" and "password" | Actual: Errors returned for properties: [email, password]
PASS | AUTH-07 | Malformed email format validation | Input: email="not-a-valid-email-string" | Expected: Validation error: email must be an email | Actual: Validation constraint failed: {"isEmail":"email must be an email"}
PASS | AUTH-08 | Register password min length check | Input: password="short" (length 5) | Expected: Validation error: password must be longer than or equal to 8 characters | Actual: Validation constraint failed: password must be longer than or equal to 8 characters
PASS | AUTH-09 | Duplicate email registration rejection | Input: email=existing@orion.dev already exists in DB | Expected: HTTP 409 ConflictException with message "Email already in use" | Actual: HTTP 409 Conflict, message="Email already in use"
PASS | GUARD-01 | Missing JWT auth cookie | Input: cookies={} | Expected: HTTP 401 UnauthorizedException("Not authenticated") | Actual: HTTP 401 Unauthorized, message="Not authenticated"
PASS | GUARD-02 | Expired/invalid JWT token rejection | Input: cookies.access_token="expired-or-tampered-token" | Expected: HTTP 401 UnauthorizedException("Invalid or expired token") | Actual: HTTP 401 Unauthorized, message="Invalid or expired token"
PASS | GUARD-03 | Valid JWT verification | Input: cookies.access_token="valid-signed-access-token" | Expected: Returns true, attaches user payload to request["user"] | Actual: canActivate=true, request.user={"sub":"usr_abc123","email":"alex@orion.dev"}
PASS | APIKEY-01 | Missing Authorization header | Input: headers={} | Expected: HTTP 401 UnauthorizedException("Missing API key") | Actual: HTTP 401 Unauthorized, message="Missing API key"
PASS | APIKEY-02 | Invalid Bearer token rejection | Input: authorization="Bearer corrupted.api.key.signature" | Expected: HTTP 401 UnauthorizedException("Invalid API key") | Actual: HTTP 401 Unauthorized, message="Invalid API key"
PASS | APIKEY-03 | Valid Project API key accepted | Input: authorization="Bearer valid.jwt.project.key" (role=anon) | Expected: Returns true, attaches projectKey payload to request["projectKey"] | Actual: canActivate=true, role=anon, projectId=proj_98765
PASS | QUERY-01 | Valid query parameter parsing | Input: select=id,name,email,created_at&status=eq.active&age=gte.18&order=created_at.desc&limit=50&offset=10 | Expected: ParsedQuery with 4 columns, 2 filters, order DESC, limit 50, offset 10 | Actual: select=[id, name, email, created_at], filters=2, limit=50, offset=10
PASS | QUERY-02 | SQL injection in select rejected | Input: select="id, name; DROP TABLE users; --" | Expected: HTTP 400 BadRequestException with "Invalid select column" | Actual: HTTP 400 BadRequest, message="Invalid select column: name; DROP TABLE users; --"
PASS | QUERY-03 | SQL injection in filter column rejected | Input: filter_column="admin_flag\" OR 1=1;--" | Expected: HTTP 400 BadRequestException with "Invalid filter column" | Actual: HTTP 400 BadRequest, message="Invalid filter column: admin_flag" OR 1=1;--"
PASS | QUERY-04 | WHERE clause construction with safe escaping | Input: filters=[status='active', title ILIKE 'test''s project'] | Expected: WHERE clause with single quotes escaped to '' | Actual: clause="WHERE "status" = 'active' AND "title" ILIKE 'test''s project'"
PASS | SQL-01 | Single statement parsing & sanitization | Input: SELECT id, name FROM users WHERE status = 'active'; | Expected: Parsed single SQL statement string without trailing semicolons | Actual: statement="SELECT id, name FROM users WHERE status = 'active'"
PASS | SQL-02 | Multi-statement injection rejection | Input: SELECT * FROM users; DROP TABLE users; | Expected: HTTP 400 BadRequestException("Only one SQL statement per run...") | Actual: HTTP 400 BadRequest, message="Only one SQL statement per run. Remove extra statements after a semicolon (e.g. a trailing SELECT)."
PASS | SQL-03 | Empty SQL query rejection | Input: query="   ;   ;  " (no statements) | Expected: HTTP 400 BadRequestException("SQL query cannot be empty") | Actual: HTTP 400 BadRequest, message="SQL query cannot be empty"
PASS | SQL-04 | Dangerous destructive SQL blocking | Input: statement="DROP DATABASE orion_production" | Expected: Detected as forbidden statement (isBlocked=true) | Actual: isBlocked=true
PASS | SYS-01 | System health check endpoint | Input: GET /health | Expected: status="ok" and timestamp in ISO format | Actual: status="ok", timestamp="2026-10-24T05:35:29.632Z"
```

---

## 5. Summary Results & Metrics

* **Total Test Suites Executed:** 9
* **Total Automated Test Cases:** 35
* **Pass Rate:** 100% (35 Passed, 0 Failed, 0 Blocked)
* **Execution Duration:** ~5.66 seconds total
* **Safety Adherence:** 100% hermetic test execution with zero destructive interactions on production databases.
