import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and deduplicates", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
    expect(cn("flex", "flex")).toBe("flex");
  });
});
