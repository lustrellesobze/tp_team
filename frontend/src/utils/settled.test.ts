import { describe, it, expect } from "vitest";
import { settled } from "./settled";

describe("settled", () => {
  it("retourne la valeur si la promesse est fulfilled", () => {
    const result: PromiseSettledResult<number[]> = { status: "fulfilled", value: [1, 2] };
    expect(settled(result, [])).toEqual([1, 2]);
  });

  it("retourne le fallback si la promesse est rejected", () => {
    const result: PromiseSettledResult<number[]> = { status: "rejected", reason: "erreur" };
    expect(settled(result, [])).toEqual([]);
  });
});
