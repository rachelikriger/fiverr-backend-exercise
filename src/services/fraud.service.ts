/**
 * Simulates fraud validation: 500ms delay, 50% probability true/false.
 * Injectable for unit tests (mock with deterministic return).
 */
export async function simulateFraudValidation(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return Math.random() < 0.5;
}
