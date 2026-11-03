import * as cheerio from "cheerio";
import { AutomatedCheck } from "../types";

export interface BrokenLink {
  url: string;
  sourceUrl: string;
  statusCode?: number;
  error?: string;
}

export interface DiscoveredElementStats {
  pagesCrawled: number;
  totalLinksFound: number;
  buttonsFound: number;
  formsFound: number;
  brokenLinks: BrokenLink[];
}

export interface LinkCrawlResult {
  checks: AutomatedCheck[];
  stats: DiscoveredElementStats;
  score: number; // 0-100
}

export async function crawlWebsiteLinks(
  targetUrl: string,
  auditRunId: string,
  maxPages = 15
): Promise<LinkCrawlResult> {
  const rootUrlObj = new URL(targetUrl);
  const origin = rootUrlObj.origin;

  const visitedUrls = new Set<string>();
  const toVisit: string[] = [targetUrl];
  const brokenLinks: BrokenLink[] = [];

  let buttonsFound = 0;
  let formsFound = 0;
  let totalLinksFound = 0;

  // First fetch the root page
  try {
    const rootRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "ReleaseLens-Crawler/1.0 (+https://releaselens.dev)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!rootRes.ok) {
      const check: AutomatedCheck = {
        id: `check_links_${Date.now()}`,
        auditRunId,
        category: "BROKEN_LINKS",
        checkName: "Navigation & Link Reachability",
        status: "FAIL",
        score: 0,
        weight: 0.35,
        rawEvidence: {
          rootStatus: rootRes.status,
          error: `Root URL returned HTTP ${rootRes.status}`,
        },
        errorMessage: `Root URL failed to load with status ${rootRes.status}`,
        timestamp: new Date().toISOString(),
      };

      return {
        checks: [check],
        stats: {
          pagesCrawled: 1,
          totalLinksFound: 0,
          buttonsFound: 0,
          formsFound: 0,
          brokenLinks: [
            {
              url: targetUrl,
              sourceUrl: "ROOT",
              statusCode: rootRes.status,
            },
          ],
        },
        score: 0,
      };
    }

    const html = await rootRes.text();
    const $ = cheerio.load(html);

    visitedUrls.add(targetUrl);

    // Count interactive elements on root page
    buttonsFound += $("button, input[type='button'], input[type='submit'], [role='button']").length;
    formsFound += $("form").length;

    // Extract internal links
    $("a[href]").each((_, el) => {
      const rawHref = $(el).attr("href");
      if (!rawHref) return;

      totalLinksFound++;

      // Ignore hash-only, mailto, tel, javascript
      if (
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        return;
      }

      try {
        const resolved = new URL(rawHref, targetUrl);
        // Only internal links within the same origin
        if (resolved.origin === origin) {
          // Normalize (strip hash)
          resolved.hash = "";
          const cleanUrl = resolved.toString();

          if (!visitedUrls.has(cleanUrl) && !toVisit.includes(cleanUrl)) {
            toVisit.push(cleanUrl);
          }
        }
      } catch {
        // Invalid URL syntax
      }
    });
  } catch (err: any) {
    const check: AutomatedCheck = {
      id: `check_links_${Date.now()}`,
      auditRunId,
      category: "BROKEN_LINKS",
      checkName: "Navigation & Link Reachability",
      status: "INCONCLUSIVE",
      score: 50,
      weight: 0.35,
      rawEvidence: { error: err.message },
      errorMessage: `Could not connect to target URL: ${err.message}`,
      timestamp: new Date().toISOString(),
    };

    return {
      checks: [check],
      stats: {
        pagesCrawled: 0,
        totalLinksFound: 0,
        buttonsFound: 0,
        formsFound: 0,
        brokenLinks: [],
      },
      score: 50,
    };
  }

  // Bounded check of discovered subpages (up to maxPages)
  const pagesToTest = toVisit.slice(0, maxPages);

  await Promise.all(
    pagesToTest.map(async (url) => {
      if (url === targetUrl) return; // Already checked root

      try {
        const res = await fetch(url, {
          method: "HEAD",
          headers: {
            "User-Agent": "ReleaseLens-Crawler/1.0 (+https://releaselens.dev)",
          },
          signal: AbortSignal.timeout(4000),
        });

        visitedUrls.add(url);

        if (res.status >= 400) {
          brokenLinks.push({
            url,
            sourceUrl: targetUrl,
            statusCode: res.status,
          });
        }
      } catch (err: any) {
        brokenLinks.push({
          url,
          sourceUrl: targetUrl,
          error: err.message || "Connection timeout",
        });
      }
    })
  );

  const pagesCrawled = visitedUrls.size;
  const brokenCount = brokenLinks.length;

  // Score calculation: 100 minus penalty per broken link
  const penalty = brokenCount * 25;
  const score = Math.max(0, 100 - penalty);
  const status: "PASS" | "FAIL" = brokenCount === 0 ? "PASS" : "FAIL";

  const checks: AutomatedCheck[] = [
    {
      id: `check_links_${Date.now()}`,
      auditRunId,
      category: "BROKEN_LINKS",
      checkName: "Broken Links & Navigation Reachability",
      status,
      score,
      weight: 0.35,
      rawEvidence: {
        pagesCrawled,
        totalLinksFound,
        buttonsFound,
        formsFound,
        brokenCount,
        brokenLinks,
      },
      errorMessage:
        brokenCount > 0
          ? `Detected ${brokenCount} broken internal route(s): ${brokenLinks.map((b) => `${b.url} (${b.statusCode || b.error})`).join(", ")}`
          : undefined,
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    checks,
    stats: {
      pagesCrawled,
      totalLinksFound,
      buttonsFound,
      formsFound,
      brokenLinks,
    },
    score,
  };
}
