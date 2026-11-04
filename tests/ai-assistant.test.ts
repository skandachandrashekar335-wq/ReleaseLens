import { describe, it, expect } from "vitest";
import { queryEvidenceAssistant } from "../src/lib/ai/gemini-assistant";
import { BugReport } from "../src/lib/types";

describe("Evidence-Grounded AI Assistant & Sanitization", () => {
  const mockBug: BugReport = {
    id: "bug_crit_01",
    projectId: "p1",
    userId: "u1",
    title: "SQL error exposed on search route",
    description: "Database stack trace revealed",
    affectedUrl: "https://app.test/search?q=1",
    stepsToReproduce: ["Go to /search?q='"],
    expectedResult: "Clean 400 Bad Request",
    actualResult: "500 Internal Error",
    severity: "CRITICAL",
    status: "OPEN",
    environmentTelemetry: {},
    evidenceUrls: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("produces deterministic evidence-backed response when API key is not present", async () => {
    const result = await queryEvidenceAssistant({
      projectUrl: "https://app.test",
      projectName: "App Test",
      findings: [],
      confirmedBugs: [mockBug],
      userQuery: "What is blocking the release?",
    });

    expect(result.answer).toContain("Confirmed Critical Blockers");
    expect(result.answer).toContain("SQL error exposed on search route");
    expect(result.referencedEvidence.some((r) => r.id === "bug_crit_01")).toBe(true);
    expect(result.suggestedAction).toContain("Fix the 1 confirmed critical defect(s)");
  });

  it("never invents passed tests when audit data is missing", async () => {
    const result = await queryEvidenceAssistant({
      projectUrl: "https://app.test",
      projectName: "App Test",
      findings: [],
      confirmedBugs: [],
      userQuery: "Did accessibility tests pass?",
    });

    expect(result.answer).not.toContain("Accessibility passed 100%");
    expect(result.answer).toContain("ReleaseLens Audit Summary");
  });
});
