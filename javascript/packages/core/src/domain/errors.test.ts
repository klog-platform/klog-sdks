import { describe, expect, it } from "vitest";
import { isRetryableStatus } from "./errors.js";

describe("isRetryableStatus", () => {
  it("solo marca 429 y 502-504 como reintentables", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
  });

  it("no reintenta errores de cliente ni auth", () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(isRetryableStatus(status)).toBe(false);
    }
  });
});
