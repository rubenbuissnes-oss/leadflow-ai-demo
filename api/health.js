export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true, service: 'LeadFlow API', version: '1.0', timestamp: new Date().toISOString() });
}
