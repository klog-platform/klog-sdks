import { describe, expect, it } from "vitest";
import {
  ingestDroppedSchema,
  ingestEventInputSchema,
  isApiTokenFormat,
  normalizeLevel,
} from "./ingest.js";

describe("ingest schemas", () => {
  it("acepta un evento mínimo y normaliza el nivel", () => {
    const parsed = ingestEventInputSchema.parse({ message: "hola" });
    expect(parsed.message).toBe("hola");
    expect(normalizeLevel(undefined)).toBe("info");
    expect(normalizeLevel("WARNING")).toBe("warn");
    expect(normalizeLevel("fatal")).toBe("error");
  });

  it("rechaza mensajes vacíos y tags de más", () => {
    expect(() => ingestEventInputSchema.parse({ message: "  " })).toThrow();
    expect(() =>
      ingestEventInputSchema.parse({ message: "x", tags: Array.from({ length: 51 }, (_, i) => `t${i}`) }),
    ).toThrow();
  });

  it("valida 202 dropped y el formato del API token", () => {
    expect(ingestDroppedSchema.parse({ dropped: true, id: "018e3a2b-7c4d-7f91-88b1-3e129f123456" }).dropped).toBe(true);
    expect(isApiTokenFormat("klog_AbCd1234_" + "x".repeat(43))).toBe(true);
    expect(isApiTokenFormat("Bearer secret")).toBe(false);
  });
});
