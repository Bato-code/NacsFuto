// functions/feed/[postId].ts
//
// Cloudflare Pages Function — runs on every request to /feed/:postId.
// Same idea as functions/courses/[id].ts: fetches the post from Supabase
// and rewrites <title>/<meta description> and adds og:*/twitter:* tags
// before the SPA shell is served, so WhatsApp/X/Facebook/Instagram/Slack
// previews for a shared post link show that post's real author, text
// excerpt, and attached image (if any) — instead of the site's generic tags.
//
// SETUP REQUIRED:
// 1. Save at `functions/feed/[postId].ts` in your repo root.
// 2. Reuses the same SUPABASE_URL / SUPABASE_ANON_KEY environment variables
//    already configured for the courses function (Pages → Settings →
//    Environment variables). No extra setup needed if you did that already.
// 3. Requires the `posts` table to have a public-read RLS policy for
//    approved posts with a matching grant to `anon` — same pattern as
//    courses/guest content visibility. If a shared post's preview keeps
//    falling back to the generic site tags, check that grant first.
// 4. Optional: `public/og-default.png` fallback image for text-only posts.

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  ASSETS: { fetch: typeof fetch }
}

interface PostRow {
  id: string
  author_name: string
  content: string
  media: { url?: string; image_url?: string; embed_url?: string } | any[] | null
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, env, request } = context
  const postId = params.postId as string

  const assetResponse = await env.ASSETS.fetch(request)
  const contentType = assetResponse.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) {
    return assetResponse
  }

  let post: PostRow | null = null
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/posts?id=eq.${postId}&approved=eq.true&select=id,author_name,content,media`,
      {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      }
    )
    if (res.ok) {
      const rows = (await res.json()) as PostRow[]
      post = rows?.[0] || null
    }
  } catch {
    post = null
  }

  if (!post) {
    return assetResponse
  }

  const pageUrl = new URL(request.url).toString()
  const origin = new URL(request.url).origin

  const excerpt = (post.content || '').slice(0, 200)
  const title = escapeHtml(`${post.author_name} on NacsFuto`)
  const description = escapeHtml(excerpt || 'View this post on NacsFuto.')

  const mediaObj = Array.isArray(post.media) ? post.media[0] : post.media
  const image = mediaObj?.url || mediaObj?.image_url || `${origin}/og-default.png`

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
