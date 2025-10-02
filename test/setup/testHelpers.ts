import { expect } from "@jest/globals";

/**
 * Helper functions for testing
 */

/**
 * Validates that a changeId is a valid UUID v7 string
 */
export const isValidUuidV7 = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

/**
 * Jest matcher to check if a value is a valid UUID v7
 */
export const expectValidUuidV7 = (changeId: any): void => {
  expect(changeId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
};