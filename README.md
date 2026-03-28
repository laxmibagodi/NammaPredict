[README (1).md](https://github.com/user-attachments/files/26326496/README.1.md)
<div align="center">

<img src="https://img.shields.io/badge/🚦_Namma_Predict-Real--00d4ff?style=for-the-badge&labelColor=0a0a0f" alt="Namma Predict"/>

<br/>
<br/>

> **A real-time traffic intelligence and congestion control system for Indian cities.**  
> Monitor • Predict • Reroute • Alert — all in one platform.

<br/>

[![Live](https://img.shields.io/badge/●_LIVE-Simulated_Mode-ff4444?style=flat-square&labelColor=1a1a2e)](/)
[![Cities](https://img.shields.io/badge/Cities-Bengaluru_•_Hyderabad_•_Delhi_•_Kalaburagi-00d4ff?style=flat-square&labelColor=1a1a2e)](/)
[![Stack](https://img.shields.io/badge/Stack-Vanilla_JS_+_Node.js_+_Leaflet-a855f7?style=flat-square&labelColor=1a1a2e)](/)
[![No Frameworks](https://img.shields.io/badge/Frameworks-Zero-22c55e?style=flat-square&labelColor=1a1a2e)](/)

</div>

---

## 🗺️ Live Map Dashboard

> Real-time road-by-road congestion on an actual Leaflet.js map with Canvas overlay at 60fps. Color-coded roads (green → yellow → orange → red), animated vehicle flow dots, glowing heatmaps, signal indicators, and BFS-powered route planning — all on real Indian road coordinates.

![Map Dashboard - Bengaluru](Screenshot_2026-03-29_034414.png)

![Map Dashboard - Kalaburagi Satellite View](Screenshot_2026-03-29_034504.png)

**What you're seeing:**
- 🟢 **Green roads** → Free flow · 🟡 **Yellow** → Moderate · 🟠 **Orange** → Heavy · 🔴 **Red** → Critical
- **Cyan dots** = live vehicle flow — fast on clear roads, crawling on jammed ones
- **Glowing blobs** = congestion heatmap spreading from hotspot junctions
- **Right panel** = Control Alerts, 30-Min Prediction, Adaptive Signal Control
- **Left panel** = Route Planner (BFS pathfinding) + live Road Status list

---

## 🚨 Live Accident Detection

> Every 8 seconds, the system scans all junctions for sudden congestion spikes. A spike > 15% in one tick auto-generates an incident card with severity, type, and location — no manual reporting needed.

![Accidents Tab](Screenshot_2026-03-29_034520.png)

![Sent Alerts Log & Server Endpoint](Screenshot_2026-03-29_034708.png)

**Alert pipeline:**
```
Auto-detected incident → Accident Card → "Send Alert" click
    → POST /api/alerts → Express Server → alerts.json (persistent)
    → Alerts Dashboard polls every 5s → Operator sees it instantly
```

---

## 🅿️ Smart Parking Management

> Live parking availability across 8+ zones per city. Updates every 5 seconds with occupancy bars, pricing, distance, and status (OPEN / CLOSING / FULL).

![Parking Tab](Screenshot_2026-03-29_034533.png)

**Darga Parking** at 94% full → automatically flagged `CLOSING`  
**Bus Stand Parking** at 8% → `OPEN` with 138 spots available

---

## 📊 Analytics Dashboard

> City-wide intelligence at a glance — total vehicles, peak congestion hour, average travel time, speed distribution, 24-hour congestion pattern, and top 5 most congested roads with trend arrows.

![Analytics Dashboard](Screenshot_2026-03-29_034551.png)

| Metric | Value |
|---|---|
| Total Vehicles Today | **1,22,141** (+4.2% vs yesterday) |
| Peak Hour Congestion | **60%** at 9:00 AM |
| Avg Travel Time | **42 min** (baseline: 22 min) |
| Incidents Resolved | **13** (3 pending) |

---

## 🔁 Smart Reroute Engine

> BFS (Breadth-First Search) on the real road graph finds 3 alternate routes between any two junctions, weighted by live congestion. Each route shows road-by-road breakdown with congestion pills.

![Reroute Tab](Screenshot_2026-03-29_034607.png)

| Route | Time | Distance | Status |
|---|---|---|---|
| **Route A** — Primary via main roads | 10 min | 2.5 km | 🟢 LOW |
| **Route B** — Avoids highest congestion | 21 min | 6.6 km | 🟡 MEDIUM |
| **Route C** — Longest but clearest path | 26 min | 7.7 km | 🟡 MEDIUM |

---

## 🖥️ Operator Alerts Dashboard

> A standalone control room view that polls `GET /api/alerts` every 5 seconds. Filter by city, severity, and type. Every alert has a timestamp, unique ID, and `✓ Received` confirmation.

![Alerts Dashboard](Screenshot_2026-03-29_034638.png)

---

## ⚙️ Tech Stack

```
Frontend          → Vanilla HTML + CSS + JavaScript (zero frameworks)
Map Tiles         → Leaflet.js (OpenStreetMap / CartoDB Dark / Esri Satellite)
Traffic Overlay   → HTML5 Canvas API — custom 2D renderer at 60fps
Routing Algorithm → BFS (Breadth-First Search) with congestion weighting
Live Traffic      → TomTom Traffic API (optional — via server proxy)
Backend           → Node.js + Express.js
Storage           → alerts.json (disk) + localStorage (browser)
```

---

## 🧠 How It Works

```
TomTom API / Simulation Engine
         │
         ▼  every 2 seconds
  Congestion = 1 - (currentSpeed / freeFlowSpeed)
  Blend: 70% live + 30% previous  ← smooth transitions
         │
         ▼
  Canvas renders at 60fps
  Leaflet tiles sync via inverse projection math
         │
         ├── Congestion > 75% spike?  → Auto-generate accident alert
         ├── Rolling 30 readings?     → 30-min prediction (extrapolation)
         ├── Route request?           → BFS on weighted road graph
         └── Alert sent?             → POST → Express → alerts.json
```

---

## 🗃️ Road Network

Each city has a **hand-crafted graph** of real GPS coordinates:

| City | Nodes | Edges |
|---|---|---|
| Bengaluru | 12 | 15 |
| Hyderabad | 12 | 15 |
| Delhi | 12 | 15 |
| Kalaburagi | 14 | 17 |

> Example nodes (Bengaluru): MG Road, Silk Board, Koramangala, Indiranagar, Whitefield, Electronic City, Hebbal, Marathahalli...

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR-USERNAME/namma-predict.git
cd namma-predict
```

### 2. Start the backend server
```bash
cd namma-predict-server
npm install
node server.js
```
Server runs at `http://localhost:3001`

### 3. Open the frontend
Open `namma-predict/index.html` in your browser — or visit `http://localhost:3001`

### 4. (Optional) Add TomTom API key
In `server.js`, set your key:
```js
const TOMTOM_API_KEY = "your_key_here";
```
Without it, the system runs in **Simulation Mode** — which mimics real Indian traffic patterns.

---

## 📁 Project Structure

```
namma-predict/
├── namma-predict/
│   ├── index.html           ← Entire frontend (single file)
│   └── style.css
│
└── namma-predict-server/
    ├── server.js            ← Express backend
    ├── alerts-dashboard.html
    ├── alerts.json          ← Persistent alert storage
    └── package.json
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serve frontend |
| `GET` | `/alerts` | Serve alerts dashboard |
| `POST` | `/api/alerts` | Store new alert |
| `GET` | `/api/alerts` | Get all alerts (filter: `?city=` `?severity=`) |
| `DELETE` | `/api/alerts` | Clear all alerts |
| `GET` | `/api/stats` | `{ total, bySeverity, byCity }` |
| `GET` | `/api/traffic/flow` | Proxy TomTom flow API |
| `POST` | `/api/traffic/batch` | Batch flow for multiple road midpoints |

---

## ✨ Key Features

- 🗺️ **Real map** with Leaflet.js — Street, Dark, and Satellite modes
- 🔴 **Live congestion** on every road, updated every 2 seconds
- 🔮 **30-minute prediction** using rolling trend extrapolation
- 🚨 **Auto accident detection** from congestion spike patterns
- 🔁 **BFS smart rerouting** with 3 alternate route options
- 🚦 **Adaptive signal timing** — extend/reduce green phases per junction
- 🅿️ **Parking management** across 8+ zones per city
- 📊 **Analytics dashboard** with 24-hour congestion patterns
- 🖥️ **Operator alerts dashboard** with persistent storage
- 🔒 **API key never exposed** — TomTom proxied through backend
- 📡 **Graceful fallback** — works offline with simulation engine

---

## 👩‍💻 Team

Built with ❤️ for Indian cities by:

**Laxmi · Midhat · Prapthi · Neha**

> *Presented at IETE Zonal Seminar & ISF Congress — 2026*

---

<div align="center">

**Namma Predict** — Because traffic intelligence should be for every Indian city, not just metros.

⭐ Star this repo if you found it useful!

</div>
