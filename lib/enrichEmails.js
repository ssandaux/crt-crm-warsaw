import { supabase } from './supabase';

const BATCH_SIZE = 5;      // parallel requests at a time
const DELAY_MS   = 300;    // ms between batches (be polite to servers)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchEmail(website) {
  if (!website || website === '—' || website === '') return null;
  try {
    const res = await fetch('/api/extract-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: website }),
    });
    if (!res.ok) return null;
    const { email } = await res.json();
    return email ?? null;
  } catch {
    return null;
  }
}

/**
 * Enriches existing businesses in Supabase that have a website but no email.
 *
 * @param {function} onProgress  - callback({ done, total, found })
 * @returns {{ updated: number, total: number }}
 */
export async function enrichEmails(onProgress) {
  // Fetch all businesses with a website but missing/empty email
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, website, email')
    .not('website', 'is', null)
    .neq('website', '')
    .neq('website', '—');

  if (error || !businesses) return { updated: 0, total: 0 };

  const candidates = businesses.filter(
    (b) => !b.email || b.email === '—' || b.email === ''
  );

  const total   = candidates.length;
  let done      = 0;
  let found     = 0;

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (biz) => {
        const email = await fetchEmail(biz.website);
        done++;
        if (email) {
          found++;
          await supabase.from('businesses').update({ email }).eq('id', biz.id);
        }
        onProgress?.({ done, total, found });
      })
    );

    if (i + BATCH_SIZE < candidates.length) await sleep(DELAY_MS);
  }

  return { updated: found, total };
}

/**
 * Enriches a specific list of business IDs (used right after Google import).
 *
 * @param {string[]} ids         - array of Supabase row IDs
 * @param {function} onProgress  - callback({ done, total, found })
 */
export async function enrichEmailsForIds(ids, onProgress) {
  if (!ids?.length) return { updated: 0, total: 0 };

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, website, email')
    .in('id', ids);

  if (error || !businesses) return { updated: 0, total: 0 };

  const candidates = businesses.filter(
    (b) => b.website && b.website !== '—' && b.website !== ''
  );

  const total = candidates.length;
  let done    = 0;
  let found   = 0;

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (biz) => {
        const email = await fetchEmail(biz.website);
        done++;
        if (email) {
          found++;
          await supabase.from('businesses').update({ email }).eq('id', biz.id);
        }
        onProgress?.({ done, total, found });
      })
    );

    if (i + BATCH_SIZE < candidates.length) await sleep(DELAY_MS);
  }

  return { updated: found, total };
}
