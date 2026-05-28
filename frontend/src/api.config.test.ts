import { describe, it, expect } from "vitest";
import { API_BASE } from "./api";

describe("configuration API frontend", () => {
  it("pointe vers le backend local /api", () => {
    expect(API_BASE).toBe("http://localhost:4000/api");
  });
});
