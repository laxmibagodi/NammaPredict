const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'alerts.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'namma-predict');

// ── TomTom API key — set via env or paste here ─────────────────────────────
const TOMTOM_KEY = process.env.TOMTOM_KEY || 'YOUR_TOMTOM_API_KEY';

app.use(cors());
app.use(express.json());

// Serve frontend (main app)
app.use(express.static(FRONTEND_DIR));

// Serve alerts dashboard at /alerts
app.get('/alerts', (req, res) => {
  res.sendFile(path.join(__dirname, 'alerts-dashboard.html'));
});

// Load alerts from file
function loadAlerts() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {}
  return [];
}

// Save alerts to file
function saveAlerts(alerts) {
  fs.writeFileSync(DB_FILE, JSON.stringify(alerts, null, 2));
}

// Initialize
if (!fs.existsSync(DB_FILE)) saveAlerts([]);

// ── Routes ──────────────────────────────────────────────────────────────────

// POST /api/alerts — receive a new alert
app.post('/api/alerts', (req, res) => {
  const alert = {
    ...req.body,
    _id: Date.now().toString(),
    receivedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  };
  const alerts = loadAlerts();
  alerts.unshift(alert);
  if (alerts.length > 200) alerts.splice(200);
  saveAlerts(alerts);
  console.log(`[ALERT] ${alert.severity} — ${alert.location} (${alert.city})`);
  res.status(201).json({ success: true, id: alert._id, message: 'Alert stored', alert });
});

// GET /api/alerts — fetch all stored alerts
app.get('/api/alerts', (req, res) => {
  const alerts = loadAlerts();
  const city = req.query.city;
  const sev  = req.query.severity;
  let filtered = alerts;
  if (city) filtered = filtered.filter(a => a.city === city);
  if (sev)  filtered = filtered.filter(a => a.severity === sev);
  res.json({ success: true, count: filtered.length, alerts: filtered });
});

// GET /api/alerts/:id — fetch single alert
app.get('/api/alerts/:id', (req, res) => {
  const alerts = loadAlerts();
  const alert = alerts.find(a => a._id === req.params.id);
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
  res.json({ success: true, alert });
});

// DELETE /api/alerts — clear all alerts
app.delete('/api/alerts', (req, res) => {
  saveAlerts([]);
  res.json({ success: true, message: 'All alerts cleared' });
});

// GET /api/stats — summary stats
app.get('/api/stats', (req, res) => {
  const alerts = loadAlerts();
  const bySev = alerts.reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {});
  const byCity = alerts.reduce((acc, a) => { acc[a.city] = (acc[a.city] || 0) + 1; return acc; }, {});
  res.json({ success: true, total: alerts.length, bySeverity: bySev, byCity });
});

// GET / — dashboard
app.get('/', (req, res) => {
  const alerts = loadAlerts();
  const rows = alerts.slice(0, 50).map(a => `
    <tr style="border-bottom:1px solid #1e2d45">
      <td style="padding:8px 12px;color:${a.severity==='CRITICAL'?'#ef4444':a.severity==='HIGH'?'#f97316':a.severity==='MEDIUM'?'#f59e0b':'#10b981'};font-weight:700">${a.severity}</td>
      <td style="padding:8px 12px">${a.location}</td>
      <td style="padding:8px 12px;color:#94a3b8">${a.type}</td>
      <td style="padding:8px 12px">${a.city}</td>
      <td style="padding:8px 12px;color:#94a3b8;font-size:.8rem">${a.description}</td>
      <td style="padding:8px 12px;color:#64748b;font-size:.75rem">${new Date(a.receivedAt).toLocaleString('en-IN')}</td>
    </tr>`).join('');
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Namma Predict — Alert Server</title>
  <meta charset="UTF-8"/>
  <meta http-equiv="refresh" content="10"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0;padding:24px}
    h1{color:#00d4ff;font-size:1.4rem;margin-bottom:4px}
    .sub{color:#64748b;font-size:.85rem;margin-bottom:20px}
    .stats{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
    .stat{background:#111827;border:1px solid #1e2d45;border-radius:8px;padding:12px 20px;min-width:120px}
    .stat-val{font-size:1.6rem;font-weight:800;color:#00d4ff}
    .stat-lbl{font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.06em}
    table{width:100%;border-collapse:collapse;background:#111827;border-radius:10px;overflow:hidden;border:1px solid #1e2d45}
    th{text-align:left;padding:10px 12px;background:#1a2235;color:#94a3b8;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}
    tr:hover{background:#1a2235}
    .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.7rem;font-weight:700}
    .endpoints{background:#111827;border:1px solid #1e2d45;border-radius:8px;padding:14px;margin-bottom:20px;font-family:monospace;font-size:.82rem;line-height:2}
    .method{display:inline-block;padding:1px 6px;border-radius:3px;font-size:.7rem;font-weight:700;margin-right:8px}
    .post{background:#f97316;color:#fff}.get{background:#10b981;color:#fff}.del{background:#ef4444;color:#fff}
  </style>
</head>
<body>
  <h1>🚦 Namma Predict — Alert Server</h1>
  <div class="sub">Live traffic incident alerts · Auto-refreshes every 10s · ${alerts.length} total alerts stored</div>
  <div class="stats">
    <div class="stat"><div class="stat-val">${alerts.length}</div><div class="stat-lbl">Total Alerts</div></div>
    <div class="stat"><div class="stat-val" style="color:#ef4444">${alerts.filter(a=>a.severity==='CRITICAL').length}</div><div class="stat-lbl">Critical</div></div>
    <div class="stat"><div class="stat-val" style="color:#f97316">${alerts.filter(a=>a.severity==='HIGH').length}</div><div class="stat-lbl">High</div></div>
    <div class="stat"><div class="stat-val" style="color:#f59e0b">${alerts.filter(a=>a.severity==='MEDIUM').length}</div><div class="stat-lbl">Medium</div></div>
    <div class="stat"><div class="stat-val" style="color:#10b981">${alerts.filter(a=>a.severity==='LOW').length}</div><div class="stat-lbl">Low</div></div>
  </div>
  <div class="endpoints">
    <div><span class="method post">POST</span>/api/alerts — Send a new alert</div>
    <div><span class="method get">GET</span>/api/alerts — Fetch all alerts (query: ?city=bengaluru&severity=HIGH)</div>
    <div><span class="method get">GET</span>/api/alerts/:id — Fetch single alert</div>
    <div><span class="method get">GET</span>/api/stats — Summary statistics</div>
    <div><span class="method del">DELETE</span>/api/alerts — Clear all alerts</div>
  </div>
  <table>
    <thead><tr><th>Severity</th><th>Location</th><th>Type</th><th>City</th><th>Description</th><th>Received At</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="padding:20px;text-align:center;color:#64748b">No alerts yet. Send one from the app.</td></tr>'}</tbody>
  </table>
</body>
</html>`);
});

// ── TomTom Traffic Proxy ───────────────────────────────────────────────────
// Proxies TomTom API calls server-side so the API key stays hidden from browser

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject);
  });
}

// GET /api/traffic/flow?lat=12.97&lng=77.59&zoom=10
// Returns TomTom flow segment data for a point
app.get('/api/traffic/flow', async (req, res) => {
  const { lat, lng, zoom = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  if (TOMTOM_KEY === 'YOUR_TOMTOM_API_KEY') {
    return res.status(503).json({ error: 'TomTom API key not configured', mock: true });
  }
  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/${zoom}/json?point=${lat},${lng}&key=${TOMTOM_KEY}`;
    const data = await httpsGet(url);
    res.json(data);
  } catch(e) {
    res.status(502).json({ error: 'TomTom API error', detail: e.message });
  }
});

// GET /api/traffic/incidents?bbox=minLng,minLat,maxLng,maxLat
// Returns TomTom incident data for a bounding box
app.get('/api/traffic/incidents', async (req, res) => {
  const { bbox } = req.query;
  if (!bbox) return res.status(400).json({ error: 'bbox required (minLng,minLat,maxLng,maxLat)' });
  if (TOMTOM_KEY === 'YOUR_TOMTOM_API_KEY') {
    return res.status(503).json({ error: 'TomTom API key not configured', mock: true });
  }
  try {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',');
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${minLng},${minLat},${maxLng},${maxLat}&fields={incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11&timeValidityFilter=present&key=${TOMTOM_KEY}`;
    const data = await httpsGet(url);
    res.json(data);
  } catch(e) {
    res.status(502).json({ error: 'TomTom API error', detail: e.message });
  }
});

// GET /api/traffic/batch — fetch flow for multiple road midpoints at once
// Body: { points: [{id, lat, lng}, ...] }
app.post('/api/traffic/batch', async (req, res) => {
  const { points } = req.body;
  if (!points || !Array.isArray(points)) return res.status(400).json({ error: 'points array required' });
  if (TOMTOM_KEY === 'YOUR_TOMTOM_API_KEY') {
    return res.status(503).json({ error: 'TomTom API key not configured', mock: true });
  }
  try {
    const results = await Promise.allSettled(
      points.map(async (pt) => {
        const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${pt.lat},${pt.lng}&key=${TOMTOM_KEY}`;
        const data = await httpsGet(url);
        const flow = data.flowSegmentData;
        return {
          id: pt.id,
          currentSpeed: flow?.currentSpeed || 0,
          freeFlowSpeed: flow?.freeFlowSpeed || 50,
          currentTravelTime: flow?.currentTravelTime || 0,
          freeFlowTravelTime: flow?.freeFlowTravelTime || 0,
          confidence: flow?.confidence || 0,
          // congestion ratio: 0=free, 1=standstill
          congestion: flow ? Math.max(0, Math.min(1, 1 - (flow.currentSpeed / (flow.freeFlowSpeed || 50)))) : null
        };
      })
    );
    const output = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') output[points[i].id] = r.value;
      else output[points[i].id] = { id: points[i].id, error: true, congestion: null };
    });
    res.json({ success: true, data: output });
  } catch(e) {
    res.status(502).json({ error: 'Batch fetch error', detail: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚦 Namma Predict Alert Server running`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api/alerts`);
  console.log(`   Dashboard:http://localhost:${PORT}/\n`);
});
