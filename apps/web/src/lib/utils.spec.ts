import { describe, it, expect } from 'vitest';
import { cn } from './utils';
import { assertAndReportWeb } from '../test-logger';

describe('Frontend UI Utility (cn)', () => {
  // WEB-UTIL-01: Combining conditional and static classes
  it('WEB-UTIL-01 | Merge static and truthy conditional classes | Expected: Classes combined', () => {
    const isPrimary = true;
    const isSmall = false;

    const result = cn(
      'rounded-md font-medium',
      isPrimary && 'bg-blue-600 text-white',
      isSmall && 'text-sm px-2',
      !isSmall && 'text-base px-4',
    );

    assertAndReportWeb(
      {
        id: 'WEB-UTIL-01',
        name: 'Merge static and conditional classNames',
        scenario: 'inputs=["rounded-md font-medium", isPrimary=true, isSmall=false]',
        expected: 'Combined classes: "rounded-md font-medium bg-blue-600 text-white text-base px-4"',
        actual: `result="${result}"`,
      },
      () => {
        expect(result).toBe('rounded-md font-medium bg-blue-600 text-white text-base px-4');
      },
    );
  });

  // WEB-UTIL-02: Tailwind merge conflict resolution
  it('WEB-UTIL-02 | Tailwind class conflict resolution | Expected: Later classes override conflicting earlier classes', () => {
    const result = cn('p-4 text-red-500', 'p-8 text-blue-500');

    assertAndReportWeb(
      {
        id: 'WEB-UTIL-02',
        name: 'Tailwind merge deduplication & override',
        scenario: 'inputs=["p-4 text-red-500", "p-8 text-blue-500"]',
        expected: 'Resolved without duplicate padding or color: "p-8 text-blue-500"',
        actual: `result="${result}"`,
      },
      () => {
        expect(result).toBe('p-8 text-blue-500');
      },
    );
  });

  // WEB-UTIL-03: Falsy values handling
  it('WEB-UTIL-03 | Handles null, undefined, false gracefully | Expected: Strips falsy items', () => {
    const result = cn('btn-base', null, undefined, false, 0 && 'never', 'active');

    assertAndReportWeb(
      {
        id: 'WEB-UTIL-03',
        name: 'Falsy inputs filtering in class merge',
        scenario: 'inputs=["btn-base", null, undefined, false, 0, "active"]',
        expected: '"btn-base active"',
        actual: `result="${result}"`,
      },
      () => {
        expect(result).toBe('btn-base active');
      },
    );
  });
});
