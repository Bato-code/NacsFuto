// functions/courses/[id].ts
//
// Cloudflare Pages Function — runs on every request to /courses/:id.
//
// Problem it solves: NacsFuto is a client-rendered SPA, so the raw HTML
// Cloudflare serves is always the same generic index.html. Link-preview
// crawlers (WhatsApp, X, Facebook, Instagram, Slack, Discord, iMessage...)
// almost never execute JavaScript — they just read whatever HTML comes back
// from the server. So no matter what meta tags your React app sets at
// runtime, shared links would always show your site's generic title/description.
//
// Fix: before returning index.html, this function fetches the course from
// Supabase and rewrites <title>, <meta name="description">, and adds
// og:*/twitter:* tags with that course's real title, description, and
// thumbnail. Real visitors still get the exact same SPA afterwards — this
// only changes what's in the initial HTML <head>, not the app itself.
//
// SETUP REQUIRED:
// 1. Save this file at `functions/courses/[id].ts` in your repo root
//    (Cloudflare Pages auto-detects the `functions/` directory).
// 2. In the Cloudflare dashboard: Pages project → Settings → Environment
//    variables, add for both Production and Preview:
//      SUPABASE_URL       = https://<your-project>.supabase.co
//      SUPABASE_ANON_KEY  = <your anon/public key>
//    (Plain env vars for the Function runtime — separate from any
//    VITE_-prefixed ones used at build time.)
// 3. Make sure your `courses` table already has a public-read RLS policy
//    for approved courses with a matching grant to `anon` — same pattern
//    you've hit before with guest content visibility. This function calls
//    Supabase as anon, so if that grant is missing you'll get an empty
//    result and it'll silently fall back to the generic SPA shell.
// 4. Optional: drop a fallback image at `public/og-default.png` for the
//    rare case a course has no thumbnail.

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  ASSETS: { fetch: typeof fetch }
}

interface CourseRow {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, env, request } = context
  const id = params.id as string

  // Get the built SPA shell (index.html) as Cloudflare would normally serve it.
  const assetResponse = await env.ASSETS.fetch(request)
  const contentType = assetResponse.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) {
    return assetResponse
  }

  // Look up the course. Any failure here just falls back to the untouched
  // SPA shell — a broken/missing course id should never break the page.
  let course: CourseRow | null = null
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/courses?id=eq.${id}&select=id,title,description,thumbnail`,
      {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      }
    )
    if (res.ok) {
      const rows = (await res.json()) as CourseRow[]
      course = rows?.[0] || null
    }
  } catch {
    course = null
  }

  if (!course) {
    return assetResponse
  }

  const pageUrl = new URL(request.url).toString()
  const origin = new URL(request.url).origin
  const title = escapeHtml(course.title)
  const description = escapeHtml((course.description || 'View this course on NacsFuto.').slice(0, 200))
  const image = course.thumbnail || `${origin}/og-default.png`

  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(title)
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', description)
      },
    })
    .on('head', {
      element(el) {
        el.append(
          `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
`,
          { html: true }
        )
      },
    })

  return rewriter.transform(assetResponse)
}
