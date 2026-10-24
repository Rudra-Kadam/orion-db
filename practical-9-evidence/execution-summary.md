# Test Execution Summary (Practical 9)

**Course:** Advanced Web Technology (AWT) — Practical 9  
**Platform:** Orion DB (Next.js 16 + NestJS 11 + Drizzle ORM + Neon PostgreSQL)  
**Execution Timestamp:** 2026-10-24 11:05:30 IST  
**Execution Mode:** Headless CLI Automated Test Run  

---

## 1. Overall Execution Statistics

| Metric | Backend (`apps/api`) | Frontend (`apps/web`) | Total Combined |
|---|:---:|:---:|:---:|
| **Test Suites / Files** | 6 passed (6 total) | 3 passed (3 total) | **9 passed (9 total)** |
| **Total Test Scenarios** | 24 | 11 | **35** |
| **Passed Tests** | 24 (100%) | 11 (100%) | **35 (100%)** |
| **Failed Tests** | 0 (0%) | 0 (0%) | **0 (0%)** |
| **Blocked / Skipped Tests**| 0 (0%) | 0 (0%) | **0 (0%)** |
| **Execution Duration** | 3.96 seconds | 1.70 seconds | **~5.66 seconds** |

---

## 2. Exact CLI Commands Executed

```powershell
# 1. Execute Backend Tests (Jest)
pnpm --filter api test

# 2. Execute Backend Coverage Analysis (Jest)
pnpm --filter api test:cov

# 3. Execute Frontend Tests (Vitest)
pnpm --filter web test

# 4. Execute Frontend Coverage Analysis (Vitest)
pnpm --filter web test:cov
```

---

## 3. Test Suites Execution Breakdown

### 3.1 Backend Test Suites (`apps/api`)
| Suite Path | Scenarios | Status | Duration |
|---|:---:|:---:|:---:|
| `src/auth/auth.controller.spec.ts` | 9 | **PASS** | 2.13 s |
| `src/auth/guards/jwt-auth.guard.spec.ts` | 3 | **PASS** | 0.85 s |
| `src/project-api/project-key.guard.spec.ts` | 3 | **PASS** | 0.72 s |
| `src/project-api/query-parser.spec.ts` | 4 | **PASS** | 0.94 s |
| `src/sql-editor/sql-editor.service.spec.ts`| 4 | **PASS** | 0.81 s |
| `src/app.controller.spec.ts` | 1 | **PASS** | 0.65 s |
| **Backend Subtotal** | **24** | **100% PASS** | **3.96 s** |

### 3.2 Frontend Test Suites (`apps/web`)
| Suite Path | Scenarios | Status | Duration |
|---|:---:|:---:|:---:|
| `src/features/auth/cookies.spec.ts` | 3 | **PASS** | 7 ms |
| `src/features/auth/client.schema.spec.ts` | 5 | **PASS** | 12 ms |
| `src/features/projects/client.schema.spec.ts` | 3 | **PASS** | 10 ms |
| **Frontend Subtotal** | **11** | **100% PASS** | **1.70 s** |

---

## 4. Code Coverage Metrics (Terminal Output)

### 4.1 Backend Core Coverage (`apps/api`)
| File / Subsystem | % Statements | % Branch | % Functions | % Lines | Status |
|---|:---:|:---:|:---:|:---:|:---:|
| `src/app.controller.ts` | **100%** | **100%** | **100%** | **100%** | Complete |
| `src/auth/dto/login.dto.ts` | **100%** | **100%** | **100%** | **100%** | Complete |
| `src/auth/dto/register.dto.ts` | **100%** | **100%** | **100%** | **100%** | Complete |
| `src/auth/guards/jwt-auth.guard.ts` | **100%** | **80.00%** | **100%** | **100%** | Complete |
| `src/project-api/project-key.guard.ts` | **100%** | **80.00%** | **100%** | **100%** | Complete |
| `src/project-api/query-parser.ts` | **87.93%** | **70.00%** | **100%** | **92.59%** | High |
| `src/sql-editor/sql-editor.service.ts` | **32.00%** | **26.92%** | **33.33%** | **30.43%** | Guarded |

### 4.2 Frontend Core Coverage (`apps/web`)
| File / Subsystem | % Statements | % Branch | % Functions | % Lines | Status |
|---|:---:|:---:|:---:|:---:|:---:|
| `src/features/auth/client.schema.ts` | **100%** | **100%** | **100%** | **100%** | Complete |
| `src/features/projects/client.schema.ts` | **100%** | **100%** | **100%** | **100%** | Complete |
| `src/features/auth/cookies.ts` | **65.71%** | **60.00%** | **40.00%** | **68.75%** | High |
| **All Tested Web Files** | **66.66%** | **60.00%** | **50.00%** | **69.04%** | Passed |

---

## 5. Evidence Files Manifest

All actual terminal logs, coverage artifacts, and complexity calculations are saved in the project root under:
`c:\Users\ASUS\Desktop\awt_proj\orion-db\practical-9-evidence\`

- **Logs Directory:** `practical-9-evidence/logs/`
  - [`backend-test-execution.log`](file:///c:/Users/ASUS/Desktop/awt_proj/orion-db/practical-9-evidence/logs/backend-test-execution.log) (Verbose CLI output from Jest)
  - [`backend-coverage.log`](file:///c:/Users/ASUS/Desktop/awt_proj/orion-db/practical-9-evidence/logs/backend-coverage.log) (Detailed coverage table from Jest)
  - [`frontend-test-execution.log`](file:///c:/Users/ASUS/Desktop/awt_proj/orion-db/practical-9-evidence/logs/frontend-test-execution.log) (Verbose CLI output from Vitest)
  - [`frontend-coverage.log`](file:///c:/Users/ASUS/Desktop/awt_proj/orion-db/practical-9-evidence/logs/frontend-coverage.log) (Detailed coverage table from Vitest)
- **Complexity Directory:** `practical-9-evidence/complexity/`
  - [`cyclomatic-complexity.md`](file:///c:/Users/ASUS/Desktop/awt_proj/orion-db/practical-9-evidence/complexity/cyclomatic-complexity.md) (McCabe metric calculations)
- **Coverage Directory:** `practical-9-evidence/coverage/`
  - `backend/` (Full Istanbul LCOV & HTML coverage assets)
  - `frontend/` (Full V8 coverage assets)
- **Screenshots Directory:** `practical-9-evidence/screenshots/`
  - Pre-existing terminal and coverage captures.
