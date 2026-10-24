export interface TestLogPayload {
  id: string;
  name: string;
  scenario: string;
  expected: string;
  actual: string;
}

export function assertAndReport(
  payload: TestLogPayload,
  assertion: () => void,
): void {
  try {
    assertion();
    const formatted = `PASS | ${payload.id} | ${payload.name} | Input: ${payload.scenario} | Expected: ${payload.expected} | Actual: ${payload.actual}`;
    console.log(formatted);
  } catch (error) {
    const formatted = `FAIL | ${payload.id} | ${payload.name} | Input: ${payload.scenario} | Expected: ${payload.expected} | Actual: ${payload.actual}`;
    console.error(formatted);
    throw error;
  }
}
