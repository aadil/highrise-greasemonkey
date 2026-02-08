require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const path = require('path');
const { format, formatDistanceToNow } = require('date-fns');
const db = require('./db');
const { runFullScan } = require('./scanner');
const { sendNewArticleAlerts } = require('./emailer');

const app = express();
const PORT = process.env.PORT || 3000;
const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL_MINUTES || '30', 10);

// --- Scan + Alert Pipeline ---
async function scanAndAlert() {
  try {
    const result = await runFullScan();
    if (result.totalNew > 0) {
      await sendNewArticleAlerts();
    }
    return result;
  } catch (err) {
    console.error('[Server] Scan+Alert pipeline error:', err);
    return { error: err.message };
  }
}

// --- Dashboard HTML ---
function renderDashboard(articles, stats, scans, query, filter, req_src) {
  const categoryColors = {
    'credit-card': '#1a73e8',
    'points-miles': '#e67e22',
    'finance': '#27ae60',
  };

  const categoryLabels = {
    'credit-card': 'Credit Card',
    'points-miles': 'Points & Miles',
    'finance': 'Finance',
  };

  // Detect source platform from source name
  function getSourcePlatform(sourceName) {
    if (sourceName.startsWith('Reddit')) return { label: 'Reddit', color: '#ff4500', icon: 'R' };
    if (sourceName.startsWith('Twitter')) return { label: 'Twitter', color: '#1da1f2', icon: 'X' };
    if (sourceName.startsWith('Google News')) return { label: 'News', color: '#4285f4', icon: 'G' };
    if (['CardExpert', 'LiveFromALounge', 'CardInfo'].includes(sourceName)) return { label: 'Blog', color: '#9c27b0', icon: 'B' };
    return { label: 'News', color: '#666', icon: 'N' };
  }

  const articleCards = articles.map((a) => {
    const color = categoryColors[a.category] || '#666';
    const label = categoryLabels[a.category] || a.category;
    const platform = getSourcePlatform(a.source);
    const timeAgo = a.discovered_at ? formatDistanceToNow(new Date(a.discovered_at + 'Z'), { addSuffix: true }) : '';
    const pubDate = a.published_at ? format(new Date(a.published_at), 'dd MMM yyyy') : '';

    return `
      <div class="card">
        <div class="card-header">
          <span class="platform-badge" style="background:${platform.color}">${platform.label}</span>
          <span class="badge" style="background:${color}">${label}</span>
          <span class="source">${a.source}</span>
          <span class="time">${timeAgo}</span>
        </div>
        <a href="${a.url}" target="_blank" class="card-title">${a.title}</a>
        ${a.summary ? `<p class="card-summary">${a.summary.substring(0, 250)}${a.summary.length > 250 ? '...' : ''}</p>` : ''}
        <div class="card-footer">
          ${pubDate ? `<span>Published: ${pubDate}</span>` : ''}
          ${a.emailed ? '<span class="emailed">&#9993; Emailed</span>' : ''}
        </div>
      </div>`;
  }).join('');

  const sourceStatsHtml = stats.map((s) => `
    <div class="stat-row">
      <span class="stat-name">${s.source}</span>
      <span class="stat-count">${s.count}</span>
    </div>`).join('');

  const scanLogHtml = scans.map((s) => {
    const time = s.scanned_at ? format(new Date(s.scanned_at + 'Z'), 'dd MMM HH:mm') : '';
    return `<tr>
      <td>${time}</td>
      <td>${s.sources_checked}</td>
      <td>${s.new_articles}</td>
      <td class="${s.errors ? 'error' : ''}">${s.errors ? '⚠' : '✓'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CC News India - The Great Indian Points</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0f2f5;
      color: #1a1a1a;
    }
    .header {
      background: linear-gradient(135deg, #1a237e, #0d47a1, #1565c0);
      color: white;
      padding: 24px 32px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .header h1 { font-size: 24px; font-weight: 700; }
    .header p { opacity: 0.85; margin-top: 4px; font-size: 14px; }
    .header-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 200px;
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      background: rgba(255,255,255,0.15);
      color: white;
      outline: none;
    }
    .search-box::placeholder { color: rgba(255,255,255,0.6); }
    .search-box:focus { background: rgba(255,255,255,0.25); }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-scan {
      background: #4caf50;
      color: white;
    }
    .btn-scan:hover { background: #388e3c; }
    .btn-filter {
      background: rgba(255,255,255,0.15);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .btn-filter:hover, .btn-filter.active {
      background: rgba(255,255,255,0.3);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
    }
    @media (max-width: 768px) {
      .container { grid-template-columns: 1fr; }
    }
    .feed { display: flex; flex-direction: column; gap: 16px; }
    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      transition: box-shadow 0.2s;
    }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .platform-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      letter-spacing: 0.5px;
    }
    .badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .source { font-size: 13px; color: #666; }
    .time { font-size: 12px; color: #999; margin-left: auto; }
    .card-title {
      display: block;
      font-size: 17px;
      font-weight: 600;
      color: #1a0dab;
      text-decoration: none;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .card-title:hover { text-decoration: underline; }
    .card-summary { font-size: 14px; color: #555; line-height: 1.5; }
    .card-footer {
      display: flex;
      gap: 12px;
      margin-top: 10px;
      font-size: 12px;
      color: #888;
    }
    .emailed { color: #4caf50; }
    .sidebar { display: flex; flex-direction: column; gap: 16px; }
    .sidebar-box {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .sidebar-box h3 {
      font-size: 15px;
      margin-bottom: 12px;
      color: #333;
      border-bottom: 2px solid #1a73e8;
      padding-bottom: 8px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid #f0f0f0;
    }
    .stat-count {
      font-weight: 600;
      color: #1a73e8;
    }
    table { width: 100%; font-size: 12px; border-collapse: collapse; }
    th, td { padding: 6px 4px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    th { font-weight: 600; color: #666; }
    .error { color: #e53935; }
    .empty-state {
      text-align: center;
      padding: 48px;
      color: #999;
    }
    .empty-state h2 { margin-bottom: 8px; color: #666; }
    .scanning-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
      margin-right: 6px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Credit Card News India</h1>
    <p><span class="scanning-indicator"></span>The Great Indian Points · News Aggregator</p>
    <div class="header-actions">
      <form method="GET" action="/" style="display:contents;">
        <input type="text" name="q" class="search-box" placeholder="Search articles..." value="${query || ''}">
      </form>
      <a href="/?filter=credit-card" class="btn btn-filter ${filter === 'credit-card' ? 'active' : ''}">Credit Cards</a>
      <a href="/?filter=points-miles" class="btn btn-filter ${filter === 'points-miles' ? 'active' : ''}">Points & Miles</a>
      <a href="/?src=twitter" class="btn btn-filter ${req_src === 'twitter' ? 'active' : ''}" style="border-color:#1da1f2">Twitter</a>
      <a href="/?src=reddit" class="btn btn-filter ${req_src === 'reddit' ? 'active' : ''}" style="border-color:#ff4500">Reddit</a>
      <a href="/" class="btn btn-filter ${!filter && !req_src ? 'active' : ''}">All</a>
      <a href="/scan" class="btn btn-scan">Scan Now</a>
    </div>
  </div>
  <div class="container">
    <div class="feed">
      ${articles.length > 0 ? articleCards : `
        <div class="empty-state">
          <h2>No articles yet</h2>
          <p>Click "Scan Now" to fetch the latest credit card news from India.</p>
        </div>`}
    </div>
    <div class="sidebar">
      <div class="sidebar-box">
        <h3>Total Articles</h3>
        <div style="font-size:32px;font-weight:700;color:#1a73e8;">${db.getArticleCount()}</div>
      </div>
      <div class="sidebar-box">
        <h3>Sources</h3>
        ${sourceStatsHtml || '<p style="color:#999;font-size:13px;">No data yet</p>'}
      </div>
      <div class="sidebar-box">
        <h3>Recent Scans</h3>
        <table>
          <thead><tr><th>Time</th><th>Src</th><th>New</th><th></th></tr></thead>
          <tbody>${scanLogHtml || '<tr><td colspan="4" style="color:#999;">No scans yet</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>
  <script>
    // Auto-refresh every 5 minutes
    setTimeout(() => window.location.reload(), 5 * 60 * 1000);
  </script>
</body>
</html>`;
}

// --- Routes ---
app.get('/', (req, res) => {
  const query = req.query.q || '';
  const filter = req.query.filter || '';
  const src = req.query.src || '';

  let articles;
  if (query) {
    articles = db.searchArticles(query);
  } else {
    articles = db.getRecentArticles(100);
  }

  if (filter) {
    articles = articles.filter((a) => a.category === filter);
  }

  if (src === 'twitter') {
    articles = articles.filter((a) => a.source.startsWith('Twitter'));
  } else if (src === 'reddit') {
    articles = articles.filter((a) => a.source.startsWith('Reddit'));
  }

  const stats = db.getSourceStats();
  const scans = db.getRecentScans(10);
  res.send(renderDashboard(articles, stats, scans, query, filter, src));
});

app.get('/scan', async (req, res) => {
  const result = await scanAndAlert();
  res.redirect('/?scanned=1&new=' + (result.totalNew || 0));
});

app.get('/api/articles', (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const offset = parseInt(req.query.offset || '0', 10);
  const q = req.query.q || '';
  const articles = q ? db.searchArticles(q, limit) : db.getRecentArticles(limit, offset);
  res.json({ articles, total: db.getArticleCount() });
});

app.get('/api/scan', async (req, res) => {
  const result = await scanAndAlert();
  res.json(result);
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalArticles: db.getArticleCount(),
    sources: db.getSourceStats(),
    recentScans: db.getRecentScans(10),
  });
});

// Health check + keepalive endpoint (for free tier cron services)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', articles: db.getArticleCount(), uptime: process.uptime() });
});

// --- Scheduler ---
// Convert minutes to cron expression
function minutesToCron(minutes) {
  if (minutes <= 0 || minutes >= 1440) return '*/30 * * * *';
  if (minutes < 60) return `*/${minutes} * * * *`;
  const hours = Math.floor(minutes / 60);
  return `0 */${hours} * * *`;
}

const cronExpr = minutesToCron(SCAN_INTERVAL);
console.log(`[Server] Scheduling scans every ${SCAN_INTERVAL} minutes (cron: ${cronExpr})`);

cron.schedule(cronExpr, () => {
  console.log(`[Server] Scheduled scan triggered at ${new Date().toISOString()}`);
  scanAndAlert();
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`[Server] Dashboard running at http://localhost:${PORT}`);
  console.log(`[Server] API endpoints:`);
  console.log(`  GET /api/articles   - List articles (query params: limit, offset, q)`);
  console.log(`  GET /api/scan       - Trigger a scan`);
  console.log(`  GET /api/stats      - View stats`);
  console.log(`  GET /scan           - Scan and redirect to dashboard`);

  // Run an initial scan on startup
  console.log('[Server] Running initial scan...');
  scanAndAlert();
});
