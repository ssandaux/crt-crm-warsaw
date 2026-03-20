// Server-side route: fetches a website URL and extracts email addresses via regex
// Called from enrichEmails.js — avoids CORS restrictions of client-side fetching

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body ?? {};
  if (!url || typeof url !== 'string') return res.status(400).json({ email: null });

  try {
    // Normalize URL
    const target = url.startsWith('http') ? url : `https://${url}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(target, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CRM-bot/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) return res.status(200).json({ email: null });

    const html = await response.text();

    // Extract emails from HTML (ignore common no-reply / system addresses)
    const matches = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) ?? [];
    const IGNORE = /noreply|no-reply|donotreply|webmaster|postmaster|@sentry|@example|@test|@localhost/i;
    const unique = [...new Set(matches)].filter((e) => !IGNORE.test(e));

    return res.status(200).json({ email: unique[0] ?? null });
  } catch {
    return res.status(200).json({ email: null });
  }
}
