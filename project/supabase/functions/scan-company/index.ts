/*
 * scan-company — Supabase Edge Function
 *
 * Fetches a tracked company's career page and extracts current job postings
 * via the Anthropic Claude API. Returns parsed postings for verification;
 * does NOT write to job_postings or scan_logs (persistence is wired up later).
 *
 * ─── Local development ────────────────────────────────────────────────────────
 *
 *  Prerequisites:
 *    1. Install the Supabase CLI  https://supabase.com/docs/guides/cli
 *    2. supabase start            (spins up local Postgres + Auth + Storage)
 *    3. Create supabase/.env.local and add:
 *         ANTHROPIC_API_KEY=sk-ant-...
 *       (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
 *        by `supabase functions serve` when running locally)
 *
 *  Serve the function:
 *    supabase functions serve scan-company \
 *      --env-file supabase/.env.local \
 *      --no-verify-jwt
 *
 *  Test with curl (replace ANON_KEY from `supabase status`, UUID from your DB):
 *    curl -i -X POST http://localhost:54321/functions/v1/scan-company \
 *      -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
 *      -H "Content-Type: application/json" \
 *      -d '{"tracked_company_id":"<uuid>"}'
 *
 * ─── Deployed (production) ────────────────────────────────────────────────────
 *
 *  Deploy:
 *    supabase functions deploy scan-company
 *
 *  Set the secret (once):
 *    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *
 *  Test:
 *    curl -i -X POST https://<project-ref>.supabase.co/functions/v1/scan-company \
 *      -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
 *      -H "Content-Type: application/json" \
 *      -d '{"tracked_company_id":"<uuid>"}'
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Strip leading/trailing markdown code fences that some models emit. */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

interface RawPosting {
  title?: unknown;
  url?: unknown;
  location?: unknown;
}

interface Posting {
  title: string;
  url: string;
  location: string;
}

interface PostingWithHash extends Posting {
  posting_hash: string;
}

/**
 * Resolve relative URLs against the career page origin so every posting URL
 * in the response is absolute.
 */
function resolvePostingUrls(postings: Posting[], careerPageUrl: string): Posting[] {
  let base: URL;
  try {
    base = new URL(careerPageUrl);
  } catch {
    // If the career page URL itself is malformed, return postings as-is.
    return postings;
  }

  return postings.map((p) => {
    if (!p.url) return p;
    try {
      return { ...p, url: new URL(p.url, base.origin).href };
    } catch {
      return p;
    }
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // ── 1. Parse request body ──────────────────────────────────────────────────
  let tracked_company_id: string;
  try {
    const body = await req.json();
    tracked_company_id = body?.tracked_company_id;
    if (!tracked_company_id || typeof tracked_company_id !== "string") {
      return jsonResponse(
        { error: "Missing or invalid tracked_company_id — expected a UUID string" },
        400,
      );
    }
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // ── 2. Build Supabase service-role client ──────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: "Server misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set" },
      500,
    );
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── 3. Look up the tracked company ────────────────────────────────────────
  const { data: company, error: dbError } = await supabase
    .from("tracked_companies")
    .select("career_page_url, company_name")
    .eq("id", tracked_company_id)
    .single();

  if (dbError || !company) {
    return jsonResponse(
      { error: "tracked_company not found", details: dbError?.message ?? null },
      404,
    );
  }

  const { career_page_url, company_name } = company as {
    career_page_url: string;
    company_name: string;
  };

  // ── 4. Fetch the career page ───────────────────────────────────────────────
  let pageText: string;
  try {
    const pageRes = await fetch(career_page_url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JobScanBot/1.0; +https://github.com/your-org/your-repo)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!pageRes.ok) {
      return jsonResponse(
        {
          error: `Career page fetch failed with HTTP ${pageRes.status}`,
          career_page_url,
        },
        502,
      );
    }

    pageText = await pageRes.text();
  } catch (err) {
    return jsonResponse(
      {
        error: "Failed to fetch career page",
        details: err instanceof Error ? err.message : String(err),
        career_page_url,
      },
      502,
    );
  }

  if (!pageText.trim()) {
    return jsonResponse(
      { error: "Career page returned empty content", career_page_url },
      502,
    );
  }

  // Truncate to ~100 KB to keep prompt tokens manageable.
  const truncatedPageText = pageText.slice(0, 100_000);

  // ── 5. Call the Anthropic Claude API ──────────────────────────────────────
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) {
    return jsonResponse(
      { error: "Server misconfiguration: ANTHROPIC_API_KEY not set" },
      500,
    );
  }

  const extractionPrompt =
    `You are a precise job-posting extractor.\n\n` +
    `Below is the HTML/text from the careers page of "${company_name}" (URL: ${career_page_url}).\n\n` +
    `Extract every current job posting visible on this page.\n` +
    `Return ONLY a JSON array — no prose, no markdown fences, no explanation.\n` +
    `Each element must have exactly these three fields:\n` +
    `  "title"    — job title (string)\n` +
    `  "url"      — link to the individual posting (string; use "" if unavailable)\n` +
    `  "location" — location or work arrangement (string; use "" if not stated)\n\n` +
    `If there are no postings, return an empty array: []\n\n` +
    `Page content:\n${truncatedPageText}`;

  let rawAiResponse: string;
  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: extractionPrompt }],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      return jsonResponse(
        {
          error: `Anthropic API returned HTTP ${aiRes.status}`,
          details: errBody.slice(0, 500),
        },
        502,
      );
    }

    const aiJson = await aiRes.json();
    rawAiResponse = (aiJson?.content?.[0]?.text as string) ?? "";
  } catch (err) {
    return jsonResponse(
      {
        error: "Failed to call Anthropic API",
        details: err instanceof Error ? err.message : String(err),
      },
      502,
    );
  }

  if (!rawAiResponse.trim()) {
    return jsonResponse({ error: "Anthropic returned an empty response" }, 502);
  }

  // ── 6. Parse the postings JSON defensively ────────────────────────────────
  let rawPostings: RawPosting[];
  try {
    const cleaned = stripMarkdownFences(rawAiResponse);
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error("Model response is not a JSON array");
    }
    rawPostings = parsed;
  } catch (parseErr) {
    return jsonResponse(
      {
        error: "Failed to parse AI response as JSON",
        details: parseErr instanceof Error ? parseErr.message : String(parseErr),
        raw_response_preview: rawAiResponse.slice(0, 500),
      },
      422,
    );
  }

  // Normalise fields and drop entries without a title.
  const postings: Posting[] = rawPostings
    .filter((p): p is RawPosting => p !== null && typeof p === "object")
    .map((p) => ({
      title: String(p.title ?? "").trim(),
      url: String(p.url ?? "").trim(),
      location: String(p.location ?? "").trim(),
    }))
    .filter((p) => p.title.length > 0);

  // ── 7. Resolve relative URLs to absolute ──────────────────────────────────
  const resolvedPostings = resolvePostingUrls(postings, career_page_url);

  // ── 8. Compute stable posting_hash = sha256(title + '|' + url) ────────────
  const postingsWithHash: PostingWithHash[] = await Promise.all(
    resolvedPostings.map(async (p) => ({
      ...p,
      posting_hash: await sha256Hex(`${p.title}|${p.url}`),
    })),
  );

  // ── 9. Return results (no DB writes in this stage) ─────────────────────────
  return jsonResponse({
    tracked_company_id,
    company_name,
    career_page_url,
    count: postingsWithHash.length,
    postings: postingsWithHash,
  });
});
