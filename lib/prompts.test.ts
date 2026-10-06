import { describe, expect, it } from "vitest";
import { renderPrompt } from "./prompts";

describe("renderPrompt", () => {
  it("substitutes known variables", () => {
    expect(renderPrompt("Vertical: {{vertical}}", { vertical: "dental-clinic" })).toBe(
      "Vertical: dental-clinic",
    );
  });

  it("replaces missing variables with an empty string instead of throwing", () => {
    expect(() => renderPrompt("Hello {{missing}}!", {})).not.toThrow();
    expect(renderPrompt("Hello {{missing}}!", {})).toBe("Hello !");
  });
});
