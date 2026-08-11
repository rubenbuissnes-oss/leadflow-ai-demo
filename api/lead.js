export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { intent, timeline, budget, details } = body;
    if (!['Buyer', 'Seller'].includes(intent)) return res.status(400).json({ ok: false, error: 'intent must be Buyer or Seller' });
    const dealValue = parseMoney(budget);
    const timelineResult = scoreTimeline(timeline);
    const valueScore = scoreValue(intent, dealValue);
    const detailScore = details ? 17 : 0;
    const score = Math.min(100, 15 + timelineResult.points + valueScore + detailScore);
    const readiness = getReadiness(score, timelineResult.points, dealValue, details);
    return res.status(200).json({ ok: true, lead: { intent, timeline: timeline || 'Unknown', timelinePoints: timelineResult.points, budget: budget || 'Unknown', dealValue, details: details || 'Unknown', score, readiness: readiness.label, readinessCode: readiness.code, nextAction: readiness.action } });
  } catch (error) { return res.status(400).json({ ok: false, error: 'Invalid request body' }); }
}

function parseMoney(input) {
  const raw = String(input || '').trim().toLowerCase().replace(/[$,\s]/g, '');
  const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)(k|m|million)?$/);
  if (!match) return 0;
  let n = Number(match[1]);
  if (match[2] === 'k') n *= 1e3;
  if (match[2] === 'm' || match[2] === 'million') n *= 1e6;
  return n;
}

function scoreTimeline(input) {
  const x = String(input || '').toLowerCase();
  if (/\b(today|now|asap|immediately)\b/.test(x)) return { label: 'Today', points: 34 };
  if (/\b(tomorrow|in 1 day)\b/.test(x)) return { label: 'Tomorrow', points: 31 };
  if (/\bin 2 days?\b/.test(x)) return { label: 'In 2 days', points: 29 };
  if (/\bin 3 days?\b/.test(x)) return { label: 'In 3 days', points: 27 };
  if (/\bthis week\b/.test(x)) return { label: 'This week', points: 25 };
  if (/\bnext week\b/.test(x)) return { label: 'Next week', points: 21 };
  const match = x.match(/\b(?:in\s*)?(\d+)\s*(weeks?|months?|years?)\b/);
  if (match) { const n = Number(match[1]), unit = match[2]; if (unit.startsWith('week')) return { label: `In ${n} week${n === 1 ? '' : 's'}`, points: Math.max(8, 24 - n * 2) }; if (unit.startsWith('month')) return { label: `In ${n} month${n === 1 ? '' : 's'}`, points: Math.max(5, 21 - n * 2) }; return { label: `In ${n} year${n === 1 ? '' : 's'}`, points: 4 }; }
  if (/\b(later|sometime|not sure|maybe)\b/.test(x)) return { label: '3–12+ months', points: 10 };
  return { label: 'Unknown', points: 0 };
}

function scoreValue(intent, value) {
  if (!value) return 0;
  if (intent === 'Buyer') { if (value >= 3e6) return 31; if (value >= 1.5e6) return 28; if (value >= 750e3) return 24; if (value >= 400e3) return 19; if (value >= 200e3) return 14; return 8; }
  if (value >= 5e6) return 31; if (value >= 2e6) return 28; if (value >= 1e6) return 25; if (value >= 500e3) return 21; if (value >= 250e3) return 15; return 8;
}

function getReadiness(score, timePoints, value, details) {
  if (score >= 78 && timePoints >= 25 && value > 0) return { code: 'P1', label: 'Priority Lead', action: 'Contact immediately and offer an appointment.' };
  if (score >= 62 && (timePoints >= 18 || value >= 750000) && details) return { code: 'P2', label: 'Qualified Lead', action: 'Follow up promptly and move toward an appointment.' };
  if (score >= 45) return { code: 'P3', label: 'Nurture Lead', action: 'Continue qualification and schedule a follow-up.' };
  return { code: 'P4', label: 'Early-Stage Lead', action: 'Keep engaged and collect more information.' };
}