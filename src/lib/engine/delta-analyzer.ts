import { AuditRun, ReleaseDelta } from "../types";

export function analyzeReleaseDelta(
  currentRun: AuditRun,
  previousRun?: AuditRun
): ReleaseDelta {
  if (!previousRun || !previousRun.rqiScore || !currentRun.rqiScore) {
    return {
      currentRunId: currentRun.id,
      rqiDelta: 0,
      qualityDelta: 0,
      coverageDelta: 0,
      newBrokenLinks: [],
      resolvedBrokenLinks: [],
      newCriticalFindings: currentRun.findings.filter((f) => f.recommendedSeverity === "CRITICAL").length,
      newConfirmedBugs: 0,
      resolvedBugs: 0,
      verdictChanged: false,
      currentVerdict: currentRun.rqiScore?.releaseVerdict || "PROVISIONAL_PASS",
      notes: ["Initial baseline release audit established."],
    };
  }

  const prevRqi = previousRun.rqiScore;
  const currRqi = currentRun.rqiScore;

  const currQuality = currRqi.qualityScore ?? currRqi.overallScore ?? 0;
  const prevQuality = prevRqi.qualityScore ?? prevRqi.overallScore ?? 0;
  const qualityDelta = currQuality - prevQuality;

  const currCov = currRqi.coveragePercent ?? currRqi.coveragePercentage ?? 0;
  const prevCov = prevRqi.coveragePercent ?? prevRqi.coveragePercentage ?? 0;
  const coverageDelta = currCov - prevCov;

  const verdictChanged = (currRqi.releaseVerdict || currRqi.verdict) !== (prevRqi.releaseVerdict || prevRqi.verdict);

  // Compare broken links
  const prevLinks = previousRun.checks.find((c) => c.category === "BROKEN_LINKS")?.rawEvidence?.brokenLinks || [];
  const currLinks = currentRun.checks.find((c) => c.category === "BROKEN_LINKS")?.rawEvidence?.brokenLinks || [];

  const prevLinkUrls = new Set<string>(prevLinks.map((l: any) => l.url));
  const currLinkUrls = new Set<string>(currLinks.map((l: any) => l.url));

  const newBrokenLinks: string[] = [];
  const resolvedBrokenLinks: string[] = [];

  for (const url of currLinkUrls) {
    if (!prevLinkUrls.has(url)) newBrokenLinks.push(url);
  }
  for (const url of prevLinkUrls) {
    if (!currLinkUrls.has(url)) resolvedBrokenLinks.push(url);
  }

  const notes: string[] = [];

  if (Math.abs(qualityDelta) > 5) {
    notes.push(
      qualityDelta < 0
        ? `Quality score regressed by ${Math.abs(qualityDelta)} points.`
        : `Quality score improved by +${qualityDelta} points.`
    );
  } else {
    notes.push("Quality score remained stable within natural variance.");
  }

  if (verdictChanged) {
    notes.push(`Release verdict transitioned from ${prevRqi.releaseVerdict} to ${currRqi.releaseVerdict}.`);
  }

  if (newBrokenLinks.length > 0) {
    notes.push(`Detected ${newBrokenLinks.length} newly broken route(s): ${newBrokenLinks.join(", ")}`);
  }

  if (resolvedBrokenLinks.length > 0) {
    notes.push(`Resolved ${resolvedBrokenLinks.length} previously failing route(s).`);
  }

  return {
    previousRunId: previousRun.id,
    currentRunId: currentRun.id,
    rqiDelta: qualityDelta,
    qualityDelta,
    coverageDelta,
    newBrokenLinks,
    resolvedBrokenLinks,
    newCriticalFindings: currentRun.findings.filter((f) => f.recommendedSeverity === "CRITICAL").length,
    newConfirmedBugs: 0,
    resolvedBugs: 0,
    verdictChanged,
    previousVerdict: prevRqi.releaseVerdict,
    currentVerdict: currRqi.releaseVerdict,
    notes,
  };
}
