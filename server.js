require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const { format, formatDistanceToNow } = require('date-fns');
const db = require('./db');
const { runFullScan } = require('./scanner');
const { sendNewArticleAlerts } = require('./emailer');
const { generateReelSuggestions } = require('./ai');
const { FILTER_KEYWORDS } = require('./sources');

const app = express();

// Filter articles to only credit-card/points/miles relevant content
function isRelevantArticle(article) {
  const text = ((article.title || '') + ' ' + (article.summary || '')).toLowerCase();
  return FILTER_KEYWORDS.some(kw => text.includes(kw));
}
const PORT = process.env.PORT || 3000;
const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL_MINUTES || '30', 10);

// --- Scan + Alert + AI Pipeline ---
async function scanAndAlert() {
  try {
    const result = await runFullScan();
    if (result.totalNew > 0) {
      await sendNewArticleAlerts();
      // Generate AI reel suggestions when new articles arrive
      await generateReelSuggestions();
    }
    return result;
  } catch (err) {
    console.error('[Server] Scan+Alert pipeline error:', err);
    return { error: err.message };
  }
}

// --- Dashboard HTML ---
function renderDashboard(suggestions, recentArticles) {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const now = format(new Date(), 'dd MMM yyyy, hh:mm a');

  const suggestionCards = suggestions.map((s, idx) => {
    let sourceLinks = '';
    try {
      const headlines = JSON.parse(s.source_headlines || '[]');
      sourceLinks = headlines.map(h =>
        `<a href="${h.url}" target="_blank" class="source-link">${h.title}</a>`
      ).join('');
    } catch (_) {}

    const timeAgo = s.generated_at
      ? formatDistanceToNow(new Date(s.generated_at + 'Z'), { addSuffix: true })
      : '';

    return `
      <div class="reel-card">
        <div class="reel-number">${idx + 1}</div>
        <div class="reel-content">
          <div class="reel-header">
            <h2 class="reel-title">${s.title}</h2>
            <span class="reel-time">${timeAgo}</span>
          </div>

          <div class="justification">
            <span class="why-badge">WHY TODAY</span>
            ${s.justification}
          </div>

          <div class="script-section">
            <div class="section-label">HOOK (Opening Line)</div>
            <div class="hook-text">"${s.hook}"</div>
          </div>

          <div class="script-section">
            <div class="section-label">FULL SCRIPT (30 sec)</div>
            <div class="script-text">${s.script.replace(/\n/g, '<br>')}</div>
            <button class="copy-btn" onclick="copyScript(this, ${idx})">Copy Script</button>
            <textarea class="hidden-script" id="script-${idx}" style="position:absolute;left:-9999px">${s.script}</textarea>
          </div>

          ${sourceLinks ? `
          <div class="sources-section">
            <div class="section-label">SOURCE ARTICLES</div>
            <div class="source-links">${sourceLinks}</div>
          </div>` : ''}
        </div>
      </div>`;
  }).join('');

  const articleListHtml = recentArticles.slice(0, 15).map(a => {
    const pubDate = a.published_at ? format(new Date(a.published_at), 'dd MMM') : '';
    return `
      <div class="article-mini">
        <a href="${a.url}" target="_blank">${a.title}</a>
        <span class="article-meta">${a.source}${pubDate ? ' · ' + pubDate : ''}</span>
      </div>`;
  }).join('');

  const noApiKeyMessage = !hasApiKey ? `
    <div class="setup-banner">
      <strong>Setup Required:</strong> Add your <code>ANTHROPIC_API_KEY</code> in Render &rarr; Environment settings to enable AI-powered reel suggestions.
      <br><br>
      <strong>Steps:</strong> Go to Render dashboard &rarr; your service &rarr; Environment (left sidebar) &rarr; Add Environment Variable &rarr;
      Key: <code>ANTHROPIC_API_KEY</code>, Value: your key from console.anthropic.com &rarr; Save &rarr; it will auto-redeploy.
    </div>` : '';

  const noSuggestionsMessage = hasApiKey && suggestions.length === 0 ? `
    <div class="empty-state">
      <h2>No reel suggestions yet</h2>
      <p>Click "Generate Ideas" below. The AI will analyze ${recentArticles.length} recent articles and create reel scripts for you.</p>
      <a href="#" onclick="triggerGenerate(); return false;" class="btn btn-generate" style="display:inline-block;margin-top:16px;">Generate Ideas Now</a>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Great Indian Points - Reel Ideas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0f;
      color: #e0e0e0;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, #1a0530, #2d1b69, #1a237e);
      padding: 24px 32px;
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .brand h1 {
      font-size: 22px;
      font-weight: 800;
      background: linear-gradient(to right, #f0c27f, #fc5c7d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .brand p {
      font-size: 13px;
      color: rgba(255,255,255,0.6);
      margin-top: 2px;
    }
    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      color: white;
    }
    .btn-generate {
      background: linear-gradient(135deg, #f0c27f, #fc5c7d);
      color: #1a0530;
    }
    .btn-generate:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .status-bar {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }
    .status-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4caf50;
      margin-right: 4px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .setup-banner {
      background: rgba(252, 92, 125, 0.1);
      border: 1px solid rgba(252, 92, 125, 0.3);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #fc5c7d;
    }
    .setup-banner code {
      background: rgba(255,255,255,0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: rgba(255,255,255,0.4);
    }
    .empty-state h2 {
      font-size: 20px;
      margin-bottom: 8px;
      color: rgba(255,255,255,0.6);
    }

    /* Reel suggestion cards */
    .reel-card {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 24px;
      transition: border-color 0.2s;
    }
    .reel-card:hover {
      border-color: rgba(240, 194, 127, 0.3);
    }
    .reel-number {
      font-size: 32px;
      font-weight: 800;
      color: rgba(240, 194, 127, 0.3);
      min-width: 40px;
      line-height: 1;
      padding-top: 4px;
    }
    .reel-content { flex: 1; min-width: 0; }
    .reel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .reel-title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      line-height: 1.3;
    }
    .reel-time {
      font-size: 11px;
      color: rgba(255,255,255,0.3);
      white-space: nowrap;
      padding-top: 4px;
    }
    .justification {
      background: linear-gradient(135deg, rgba(252,92,125,0.1), rgba(240,194,127,0.1));
      border-left: 3px solid #fc5c7d;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #f0c27f;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .why-badge {
      background: #fc5c7d;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .script-section {
      margin-bottom: 16px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,0.3);
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .hook-text {
      font-size: 18px;
      font-weight: 600;
      font-style: italic;
      color: #f0c27f;
      line-height: 1.4;
      padding: 8px 0;
    }
    .script-text {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 16px;
      font-size: 14px;
      line-height: 1.7;
      color: rgba(255,255,255,0.85);
      white-space: pre-wrap;
    }
    .copy-btn {
      margin-top: 8px;
      padding: 6px 14px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 6px;
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .copy-btn:hover { background: rgba(255,255,255,0.15); color: white; }
    .sources-section { margin-top: 4px; }
    .source-links {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .source-link {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      text-decoration: none;
      padding: 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .source-link:hover { color: #f0c27f; }

    /* Recent articles sidebar */
    .recent-section {
      margin-top: 40px;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 24px;
    }
    .recent-section h3 {
      font-size: 14px;
      font-weight: 700;
      color: rgba(255,255,255,0.4);
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    .article-mini {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .article-mini a {
      font-size: 13px;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      line-height: 1.4;
      display: block;
    }
    .article-mini a:hover { color: #f0c27f; }
    .article-meta {
      font-size: 11px;
      color: rgba(255,255,255,0.25);
      margin-top: 2px;
      display: block;
    }

    @media (max-width: 640px) {
      .header { padding: 16px; }
      .container { padding: 16px 12px; }
      .reel-card { flex-direction: column; gap: 8px; padding: 16px; }
      .reel-number { font-size: 24px; }
      .reel-title { font-size: 17px; }
      .hook-text { font-size: 16px; }
    }

    .loading-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10,10,15,0.85);
      z-index: 200;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 16px;
    }
    .loading-overlay.active { display: flex; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #f0c27f;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div class="brand">
        <h1>The Great Indian Points</h1>
        <p>AI-Powered Reel Ideas Dashboard</p>
      </div>
      <div class="header-actions">
        <a href="/articles" class="btn btn-secondary">Raw Feed</a>
        <a href="/scan" class="btn btn-secondary">Scan News</a>
        <a href="#" onclick="triggerGenerate(); return false;" class="btn btn-generate">Generate Ideas</a>
      </div>
    </div>
    <div class="status-bar">
      <span><span class="status-dot"></span>Auto-scanning every ${SCAN_INTERVAL} min</span>
      <span>Last updated: ${now}</span>
      <span>Articles (3 days): ${recentArticles.length}</span>
    </div>
  </div>

  <div class="container">
    ${noApiKeyMessage}
    ${noSuggestionsMessage}
    ${suggestionCards}

    ${recentArticles.length > 0 ? `
    <div class="recent-section">
      <h3>LATEST NEWS FEED (LAST 3 DAYS)</h3>
      ${articleListHtml}
    </div>` : ''}
  </div>

  <div class="loading-overlay" id="loading">
    <div class="spinner"></div>
    <div class="loading-text">Scanning news sources & generating reel ideas...</div>
  </div>

  <script>
    function copyScript(btn, idx) {
      const text = document.getElementById('script-' + idx).value;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy Script'; }, 2000);
      });
    }

    function triggerGenerate() {
      var overlay = document.getElementById('loading');
      var loadingText = overlay.querySelector('.loading-text');
      overlay.classList.add('active');
      loadingText.textContent = 'Generating reel ideas from recent news...';

      fetch('/api/generate', { signal: AbortSignal.timeout(25000) })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.error) {
            loadingText.innerHTML = '<span style="color:#fc5c7d;">' + data.message + '</span>';
            setTimeout(function() { overlay.classList.remove('active'); }, 4000);
          } else {
            window.location.reload();
          }
        })
        .catch(function() {
          loadingText.textContent = 'Timed out. Retrying...';
          // Retry once with longer timeout
          fetch('/api/generate', { signal: AbortSignal.timeout(55000) })
            .then(function(r) { return r.json(); })
            .then(function() { window.location.reload(); })
            .catch(function() {
              loadingText.innerHTML = 'Generation failed. Check that ANTHROPIC_API_KEY is set in Render Environment settings.';
              setTimeout(function() { overlay.classList.remove('active'); }, 5000);
            });
        });
    }

    // Auto-refresh every 10 minutes
    setTimeout(function() { window.location.reload(); }, 10 * 60 * 1000);
  </script>
</body>
</html>`;
}

// --- Old article feed dashboard ---
function renderArticleFeed(articles) {
  const articleCards = articles.map((a) => {
    const timeAgo = a.discovered_at ? formatDistanceToNow(new Date(a.discovered_at + 'Z'), { addSuffix: true }) : '';
    const pubDate = a.published_at ? format(new Date(a.published_at), 'dd MMM yyyy') : '';
    return `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:12px;color:rgba(255,255,255,0.4);">${a.source}</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.25);">${timeAgo}</span>
        </div>
        <a href="${a.url}" target="_blank" style="color:#f0c27f;text-decoration:none;font-size:15px;font-weight:600;line-height:1.4;">${a.title}</a>
        ${pubDate ? `<div style="font-size:11px;color:rgba(255,255,255,0.25);margin-top:4px;">Published: ${pubDate}</div>` : ''}
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Raw Feed - The Great Indian Points</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;color:#e0e0e0;}</style>
</head><body>
<div style="padding:24px 32px;background:linear-gradient(135deg,#1a0530,#2d1b69);border-bottom:1px solid rgba(255,255,255,0.1);">
  <h1 style="font-size:20px;color:#f0c27f;">Raw News Feed</h1>
  <p style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">All articles from last 3 days</p>
  <a href="/" style="color:#fc5c7d;font-size:13px;margin-top:8px;display:inline-block;">Back to Reel Ideas</a>
</div>
<div style="max-width:800px;margin:0 auto;padding:24px 16px;">
  ${articles.length > 0 ? articleCards : '<p style="text-align:center;color:rgba(255,255,255,0.3);padding:48px;">No articles from the last 3 days.</p>'}
</div>
</body></html>`;
}

// --- Routes ---
app.get('/', (req, res) => {
  const suggestions = db.getReelSuggestions(10);
  const recentArticles = db.getArticlesFromLastDays(3).filter(isRelevantArticle);
  res.send(renderDashboard(suggestions, recentArticles));
});

app.get('/articles', (req, res) => {
  const articles = db.getArticlesFromLastDays(3).filter(isRelevantArticle);
  res.send(renderArticleFeed(articles));
});

app.get('/scan', async (req, res) => {
  const result = await scanAndAlert();
  res.redirect('/');
});

app.get('/api/generate', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({
      error: 'ANTHROPIC_API_KEY not configured',
      message: 'Add your Anthropic API key in Render Environment settings to enable AI reel suggestions.'
    });
  }
  try {
    // Only generate suggestions from existing articles (scan runs separately on cron)
    const suggestions = await generateReelSuggestions();
    res.json({ suggestions: suggestions.length, ok: true });
  } catch (err) {
    console.error('[Server] Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    recentArticles: db.getArticlesFromLastDays(3).length,
    suggestions: db.getReelSuggestions(1).length,
  });
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

app.get('/api/suggestions', (req, res) => {
  res.json({ suggestions: db.getReelSuggestions(10) });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalArticles: db.getArticleCount(),
    recentArticles: db.getArticlesFromLastDays(3).length,
    sources: db.getSourceStats(),
    recentScans: db.getRecentScans(10),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', articles: db.getArticleCount(), uptime: process.uptime() });
});

// --- Scheduler ---
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
  console.log(`[Server] Routes:`);
  console.log(`  GET /             - Reel ideas dashboard`);
  console.log(`  GET /articles     - Raw article feed (last 3 days)`);
  console.log(`  GET /api/generate - Scan + generate reel suggestions`);
  console.log(`  GET /api/articles - List articles`);
  console.log(`  GET /api/suggestions - Get reel suggestions`);
  console.log(`  GET /scan         - Trigger scan`);

  // Run initial scan + generate on startup
  console.log('[Server] Running initial scan...');
  scanAndAlert();
});
