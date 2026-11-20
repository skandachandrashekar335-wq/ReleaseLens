import * as cheerio from "cheerio";
import crypto from "crypto";
import { AutomatedCheck, PotentialFinding } from "../types";
import { validateTargetUrl } from "./ssrf-guard";

export interface HtmlInspectionResult {
  checks: AutomatedCheck[];
  findings: PotentialFinding[];
  metadata: {
    title: string | null;
    metaDescription: string | null;
    htmlLang: string | null;
    h1Count: number;
    imagesCount: number;
    imagesMissingAlt: number;
    formsCount: number;
    inputsMissingLabels: number;
    mixedContentUrls: string[];
    deadLinksCount: number;
  };
}

export async function inspectHtmlDom(
  targetUrl: string,
  auditRunId: string,
  projectId: string
): Promise<HtmlInspectionResult> {
  const timestamp = new Date().toISOString();
  const checks: AutomatedCheck[] = [];
  const findings: PotentialFinding[] = [];

  const ssrf = await validateTargetUrl(targetUrl);
  if (!ssrf.isAllowed) {
    return {
      checks: [
        {
          id: `check_dom_ssrf_${Date.now()}`,
          auditRunId,
          category: "AVAILABILITY",
          dimension: "security",
          name: "HTML DOM Inspection Perimeter Check",
          status: "FAIL",
          score: 0,
          errorMessage: ssrf.reason || "Target URL blocked by SSRF perimeter",
          timestamp,
        },
      ],
      findings: [],
      metadata: {
        title: null,
        metaDescription: null,
        htmlLang: null,
        h1Count: 0,
        imagesCount: 0,
        imagesMissingAlt: 0,
        formsCount: 0,
        inputsMissingLabels: 0,
        mixedContentUrls: [],
        deadLinksCount: 0,
      },
    };
  }

  let html = "";
  let responseStatus = 0;
  let fetchLatencyMs = 0;

  try {
    const startTime = Date.now();
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "ReleaseLens-AutonomousAuditor/1.0 (+https://releaselens.dev)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    fetchLatencyMs = Date.now() - startTime;
    responseStatus = res.status;
    html = await res.text();
  } catch (err: any) {
    checks.push({
      id: `check_dom_fetch_err_${Date.now()}`,
      auditRunId,
      category: "AVAILABILITY",
      dimension: "availability",
      name: "HTML Target Fetch & Response Check",
      status: "FAIL",
      score: 0,
      errorMessage: `Could not fetch target HTML: ${err.message}`,
      timestamp,
    });
    return {
      checks,
      findings,
      metadata: {
        title: null,
        metaDescription: null,
        htmlLang: null,
        h1Count: 0,
        imagesCount: 0,
        imagesMissingAlt: 0,
        formsCount: 0,
        inputsMissingLabels: 0,
        mixedContentUrls: [],
        deadLinksCount: 0,
      },
    };
  }

  const $ = cheerio.load(html);

  // 1. Title Inspection
  const title = $("title").first().text().trim() || null;
  const hasValidTitle = Boolean(title && title.length > 0);
  if (!hasValidTitle) {
    const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:SEO:missing_title`).digest("hex").substring(0, 16)}`;
    findings.push({
      id: fId,
      auditRunId,
      projectId,
      testSource: "HTML_INSPECTOR",
      sourceCheck: "document_title",
      affectedUrl: targetUrl,
      title: "Missing Document Title (<title>)",
      description: "Document lacks a descriptive <title> tag. Essential for search indexability and browser accessibility.",
      expectedBehavior: "HTML document contains a concise, descriptive <title> in <head>.",
      observedBehavior: "No non-empty <title> element was found in the document head.",
      recommendedSeverity: "MEDIUM",
      suggestedSeverity: "MEDIUM",
      confidence: "HIGH",
      status: "NEEDS_REVIEW",
      createdAt: timestamp,
      evidence: { tag: "title", value: null },
    });
  }

  // 2. Meta Description Inspection
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || null;
  if (!metaDescription) {
    const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:SEO:missing_meta_desc`).digest("hex").substring(0, 16)}`;
    findings.push({
      id: fId,
      auditRunId,
      projectId,
      testSource: "HTML_INSPECTOR",
      sourceCheck: "meta_description",
      affectedUrl: targetUrl,
      title: "Missing Meta Description",
      description: "The document does not define a <meta name=\"description\"> tag for search snippet generation.",
      expectedBehavior: "Document provides an informative meta description between 50 and 160 characters.",
      observedBehavior: "No <meta name=\"description\"> tag present.",
      recommendedSeverity: "LOW",
      suggestedSeverity: "LOW",
      confidence: "HIGH",
      status: "NEEDS_REVIEW",
      createdAt: timestamp,
      evidence: { tag: 'meta[name="description"]' },
    });
  }

  // 3. HTML Lang Attribute
  const htmlLang = $("html").attr("lang")?.trim() || null;
  if (!htmlLang) {
    const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:A11Y:missing_html_lang`).digest("hex").substring(0, 16)}`;
    findings.push({
      id: fId,
      auditRunId,
      projectId,
      testSource: "HTML_INSPECTOR",
      sourceCheck: "html_lang",
      affectedUrl: targetUrl,
      title: "Missing 'lang' Attribute on <html> Element",
      description: "The <html> element does not specify a language attribute (e.g. lang=\"en\"). Screen readers cannot pronounce text correctly.",
      expectedBehavior: "<html lang=\"en\"> declared on document root.",
      observedBehavior: "<html> element has no lang attribute.",
      recommendedSeverity: "MEDIUM",
      suggestedSeverity: "MEDIUM",
      confidence: "HIGH",
      status: "NEEDS_REVIEW",
      createdAt: timestamp,
      evidence: { tag: "html", lang: null },
    });
  }

  // 4. Heading Hierarchy (H1 Count)
  const h1Elements = $("h1");
  const h1Count = h1Elements.length;
  if (h1Count === 0) {
    const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:A11Y:missing_h1`).digest("hex").substring(0, 16)}`;
    findings.push({
      id: fId,
      auditRunId,
      projectId,
      testSource: "HTML_INSPECTOR",
      sourceCheck: "heading_hierarchy",
      affectedUrl: targetUrl,
      title: "Missing Level 1 Heading (<h1>)",
      description: "No <h1> element found on the landing route. Page outline lacks a top-level semantic landmark.",
      expectedBehavior: "Page contains exactly one descriptive <h1> element representing the main topic.",
      observedBehavior: "Found 0 <h1> elements.",
      recommendedSeverity: "LOW",
      suggestedSeverity: "LOW",
      confidence: "HIGH",
      status: "NEEDS_REVIEW",
      createdAt: timestamp,
      evidence: { h1Count: 0 },
    });
  } else if (h1Count > 1) {
    const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:A11Y:multiple_h1`).digest("hex").substring(0, 16)}`;
    findings.push({
      id: fId,
      auditRunId,
      projectId,
      testSource: "HTML_INSPECTOR",
      sourceCheck: "heading_hierarchy",
      affectedUrl: targetUrl,
      title: `Multiple Level 1 Headings (${h1Count} <h1> Found)`,
      description: `Document contains ${h1Count} <h1> tags. Modern accessibility conventions recommend a single primary <h1> per document view.`,
      expectedBehavior: "Single top-level <h1> landmark per page.",
      observedBehavior: `Found ${h1Count} <h1> elements.`,
      recommendedSeverity: "LOW",
      suggestedSeverity: "LOW",
      confidence: "MEDIUM",
      status: "NEEDS_REVIEW",
      createdAt: timestamp,
      evidence: { h1Count },
    });
  }

  // 5. Image Accessibility (Alt Attributes)
  const allImages = $("img");
  const imagesCount = allImages.length;
  const missingAltImages: string[] = [];
  allImages.each((_, el) => {
    const alt = $(el).attr("alt");
    const src = $(el).attr("src") || "[unknown src]";
    if (typeof alt === "undefined") {
      missingAltImages.push(src);
    }
  });

  if (missingAltImages.length > 0) {
    const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:A11Y:img_missing_alt`).digest("hex").substring(0, 16)}`;
    findings.push({
      id: fId,
      auditRunId,
      projectId,
      testSource: "HTML_INSPECTOR",
      sourceCheck: "image_alt_text",
      affectedUrl: targetUrl,
      title: `${missingAltImages.length} Image(s) Missing Accessible 'alt' Attributes`,
      description: `Discovered ${missingAltImages.length} <img> element(s) without an alt attribute. Screen readers will read filename URLs instead of meaningful descriptions.`,
      expectedBehavior: "All <img> elements provide an alt attribute (descriptive or empty alt=\"\" for decorative icons).",
      observedBehavior: `${missingAltImages.length} images have no alt attribute defined.`,
      recommendedSeverity: "MEDIUM",
      suggestedSeverity: "MEDIUM",
      confidence: "HIGH",
      status: "NEEDS_REVIEW",
      createdAt: timestamp,
      evidence: {
        totalImages: imagesCount,
        missingAltCount: missingAltImages.length,
        samples: missingAltImages.slice(0, 5),
      },
    });
  }

  // 6. Form Inputs Missing Labels
  const formInputs = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
  const unlabeledInputs: string[] = [];
  formInputs.each((_, el) => {
    const id = $(el).attr("id");
    const ariaLabel = $(el).attr("aria-label");
    const ariaLabelledby = $(el).attr("aria-labelledby");
    const name = $(el).attr("name") || $(el).attr("type") || "input";

    const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
    const isWrappedInLabel = $(el).closest("label").length > 0;

    if (!hasLabel && !isWrappedInLabel && !ariaLabel && !ariaLabelledby) {
      unlabeledInputs.push(name);
    }
  });

  if (unlabeledInputs.length > 0) {
    const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:A11Y:unlabeled_inputs`).digest("hex").substring(0, 16)}`;
    findings.push({
      id: fId,
      auditRunId,
      projectId,
      testSource: "HTML_INSPECTOR",
      sourceCheck: "form_accessible_labels",
      affectedUrl: targetUrl,
      title: `${unlabeledInputs.length} Form Input(s) Missing Accessible Labels`,
      description: `Detected ${unlabeledInputs.length} interactive form element(s) without an explicit <label>, aria-label, or aria-labelledby association.`,
      expectedBehavior: "Every form control must have an associated programmatic label.",
      observedBehavior: `${unlabeledInputs.length} input(s) lack labels.`,
      recommendedSeverity: "HIGH",
      suggestedSeverity: "HIGH",
      confidence: "HIGH",
      status: "NEEDS_REVIEW",
      createdAt: timestamp,
      evidence: { unlabeledCount: unlabeledInputs.length, samples: unlabeledInputs.slice(0, 5) },
    });
  }

  // 7. Mixed Content (HTTP on HTTPS)
  const isHttps = targetUrl.startsWith("https://");
  const mixedContentUrls: string[] = [];
  if (isHttps) {
    $("[src]").each((_, el) => {
      const src = $(el).attr("src");
      if (src && src.startsWith("http://")) {
        mixedContentUrls.push(src);
      }
    });
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("http://")) {
        mixedContentUrls.push(href);
      }
    });

    if (mixedContentUrls.length > 0) {
      const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:SEC:mixed_content`).digest("hex").substring(0, 16)}`;
      findings.push({
        id: fId,
        auditRunId,
        projectId,
        testSource: "SECURITY_PROBE",
        sourceCheck: "mixed_content",
        affectedUrl: targetUrl,
        title: "Passive/Active Mixed Content Detected (HTTP resources on HTTPS)",
        description: `Discovered ${mixedContentUrls.length} resource(s) loaded over unencrypted HTTP on an HTTPS origin, violating transport security.`,
        expectedBehavior: "All scripts, stylesheets, and assets must be loaded via secure HTTPS.",
        observedBehavior: `Loaded ${mixedContentUrls.length} asset(s) over plaintext http://.`,
        recommendedSeverity: "CRITICAL",
        suggestedSeverity: "CRITICAL",
        confidence: "HIGH",
        status: "NEEDS_REVIEW",
        createdAt: timestamp,
        evidence: { mixedContentCount: mixedContentUrls.length, samples: mixedContentUrls.slice(0, 5) },
      });
    }
  }

  // 8. Dead or Placeholder Local Anchors
  let deadLinksCount = 0;
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href === "" || href === "#" || href === "javascript:void(0)" || href === "javascript:;") {
      deadLinksCount++;
    }
  });

  if (deadLinksCount > 3) {
    const fId = `fnd_${crypto.createHash("sha256").update(`${projectId}:DOM:dead_anchors`).digest("hex").substring(0, 16)}`;
    findings.push({
      id: fId,
      auditRunId,
      projectId,
      testSource: "HTML_INSPECTOR",
      sourceCheck: "placeholder_anchors",
      affectedUrl: targetUrl,
      title: `${deadLinksCount} Placeholder / Empty Anchor Links Detected`,
      description: `Found ${deadLinksCount} <a> tag(s) with empty, '#', or 'javascript:void(0)' href attributes. May cause jump-to-top scroll jitter or trap keyboard users.`,
      expectedBehavior: "Anchors should link to valid destination routes or be replaced with <button> elements for interactive triggers.",
      observedBehavior: `${deadLinksCount} placeholder links detected.`,
      recommendedSeverity: "LOW",
      suggestedSeverity: "LOW",
      confidence: "MEDIUM",
      status: "NEEDS_REVIEW",
      createdAt: timestamp,
      evidence: { deadLinksCount },
    });
  }

  // Record DOM Hygiene AutomatedCheck
  const domScore = Math.max(
    20,
    100 -
      (hasValidTitle ? 0 : 15) -
      (metaDescription ? 0 : 10) -
      (htmlLang ? 0 : 15) -
      (missingAltImages.length > 0 ? 15 : 0) -
      (unlabeledInputs.length > 0 ? 20 : 0) -
      (mixedContentUrls.length > 0 ? 30 : 0)
  );

  checks.push({
    id: `check_dom_hygiene_${Date.now()}`,
    auditRunId,
    category: "DOM_HYGIENE",
    dimension: "functional",
    name: "Semantic HTML DOM & Accessibility Hygiene",
    status: domScore >= 75 ? "PASS" : domScore >= 50 ? "WARNING" : "FAIL",
    score: domScore,
    rawEvidence: {
      title,
      metaDescription,
      htmlLang,
      h1Count,
      imagesCount,
      imagesMissingAlt: missingAltImages.length,
      unlabeledInputsCount: unlabeledInputs.length,
      mixedContentCount: mixedContentUrls.length,
      deadLinksCount,
      fetchLatencyMs,
      responseStatus,
    },
    timestamp,
  });

  return {
    checks,
    findings,
    metadata: {
      title,
      metaDescription,
      htmlLang,
      h1Count,
      imagesCount,
      imagesMissingAlt: missingAltImages.length,
      formsCount: $("form").length,
      inputsMissingLabels: unlabeledInputs.length,
      mixedContentUrls,
      deadLinksCount,
    },
  };
}
