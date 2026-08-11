export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { intent, timeline, budget, details } = req.body || {};
    if (!intent || !['Buyer', 'Seller'].includes(intent)) {
      return res.status(400).json({ error: 'intent must be Buyer or Seller' });
    }

    const value = parseMoney(budget);
    const timelineScore = scoreTimeline(timeline);
    const valueScore = scoreValue(intent, value);
    const detailScore = details ? 17 : 0;
    const intentScore = 18;
    const score = Math.min(100, intentScore + timelineScore + valueScore + detailScore);
    const temperature = score >= 78 ? 'HOT' : score >= 48 ? 'WARM' : 'COLD';

    return res.status(200).json({
      ok: true,
      lead: {
        intent,
        timeline: timeline || 'Unknown',
        budget: budget || 'Unknown',
        dealValue: value,
        details: details || 'Unknown',
        score,
        temperature
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to score lead' });
  }
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
  if (/today|now|asap|immediately/.test(x)) return 34;
  if (/tomorrow|in 1 day/.test(x)) return 31;
  if (/in 2 days/.test(x)) return 29;
  if (/in 3 days/.test(x)) return 27;
  if (/this week/.test(x)) return 25;
  if (/next week/.test(x)) return 21;
  const match = x.match(/(?:in\s*)?(\d+)\s*(week|weeks|month|months|year|years)/);
  if (!match) return /later|sometime|not sure|maybe/.test(x) ? 10 : 0;
  const n = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith('week')) return Math.max(8, 24 - n * 2);
  if (unit.startsWith('month')) return Math.max(5, 21 - n * 2);
  return 4;
}

function scoreValue(intent, value) {
  if (!value) return 0;
  if (intent === 'Buyer') {
    if (value >= 3e6) return 31;
    if (value >= 1.5e6) return 28;
    if (value >= 750e3) return 24;
    if (value >= 400e3) return 19;
    if (value >= 200e3) return 14;
    return 8;
  }
  if (value >= 5e6) return 31;
  if (value >= 2e6) return 28;
  if (value >= 1e6) return 25;
  if (value >= 500e3) return 21;
  if (value >= 250e3) return 15;
  return 8;
}
