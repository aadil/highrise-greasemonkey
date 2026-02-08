const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'news.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      source TEXT NOT NULL,
      category TEXT DEFAULT 'credit-card',
      published_at TEXT,
      discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
      emailed INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_articles_discovered
      ON articles(discovered_at DESC);

    CREATE INDEX IF NOT EXISTS idx_articles_source
      ON articles(source);

    CREATE INDEX IF NOT EXISTS idx_articles_category
      ON articles(category);

    CREATE TABLE IF NOT EXISTS scan_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scanned_at TEXT NOT NULL DEFAULT (datetime('now')),
      sources_checked INTEGER DEFAULT 0,
      new_articles INTEGER DEFAULT 0,
      errors TEXT
    );

    CREATE TABLE IF NOT EXISTS reel_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      hook TEXT,
      script TEXT NOT NULL,
      justification TEXT NOT NULL,
      source_article_ids TEXT,
      source_headlines TEXT,
      generated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_reel_generated
      ON reel_suggestions(generated_at DESC);
  `);
}

function insertArticle({ url, title, summary, source, category, publishedAt }) {
  const stmt = getDb().prepare(`
    INSERT OR IGNORE INTO articles (url, title, summary, source, category, published_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(url, title, summary || '', source, category || 'credit-card', publishedAt || null);
  return result.changes > 0; // true if new article was inserted
}

function getRecentArticles(limit = 50, offset = 0) {
  return getDb().prepare(`
    SELECT * FROM articles
    ORDER BY discovered_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function getUnmailedArticles() {
  return getDb().prepare(`
    SELECT * FROM articles WHERE emailed = 0
    ORDER BY discovered_at DESC
  `).all();
}

function markAsEmailed(ids) {
  if (!ids.length) return;
  const placeholders = ids.map(() => '?').join(',');
  getDb().prepare(`UPDATE articles SET emailed = 1 WHERE id IN (${placeholders})`).run(...ids);
}

function getArticleCount() {
  return getDb().prepare('SELECT COUNT(*) as count FROM articles').get().count;
}

function getSourceStats() {
  return getDb().prepare(`
    SELECT source, COUNT(*) as count, MAX(discovered_at) as latest
    FROM articles GROUP BY source ORDER BY count DESC
  `).all();
}

function logScan(sourcesChecked, newArticles, errors) {
  getDb().prepare(`
    INSERT INTO scan_log (sources_checked, new_articles, errors)
    VALUES (?, ?, ?)
  `).run(sourcesChecked, newArticles, errors || null);
}

function getRecentScans(limit = 20) {
  return getDb().prepare(`
    SELECT * FROM scan_log ORDER BY scanned_at DESC LIMIT ?
  `).all(limit);
}

function searchArticles(query, limit = 50) {
  return getDb().prepare(`
    SELECT * FROM articles
    WHERE title LIKE ? OR summary LIKE ?
    ORDER BY discovered_at DESC
    LIMIT ?
  `).all(`%${query}%`, `%${query}%`, limit);
}

function getArticlesFromLastDays(days = 3) {
  return getDb().prepare(`
    SELECT * FROM articles
    WHERE published_at >= datetime('now', '-' || ? || ' days')
       OR (published_at IS NULL AND discovered_at >= datetime('now', '-' || ? || ' days'))
    ORDER BY COALESCE(published_at, discovered_at) DESC
  `).all(days, days);
}

function insertReelSuggestion({ title, hook, script, justification, sourceArticleIds, sourceHeadlines }) {
  return getDb().prepare(`
    INSERT INTO reel_suggestions (title, hook, script, justification, source_article_ids, source_headlines)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, hook || '', script, justification, JSON.stringify(sourceArticleIds || []), JSON.stringify(sourceHeadlines || []));
}

function getReelSuggestions(limit = 20) {
  return getDb().prepare(`
    SELECT * FROM reel_suggestions ORDER BY generated_at DESC LIMIT ?
  `).all(limit);
}

function clearReelSuggestions() {
  getDb().prepare('DELETE FROM reel_suggestions').run();
}

module.exports = {
  getDb,
  insertArticle,
  getRecentArticles,
  getUnmailedArticles,
  markAsEmailed,
  getArticleCount,
  getSourceStats,
  logScan,
  getRecentScans,
  searchArticles,
  getArticlesFromLastDays,
  insertReelSuggestion,
  getReelSuggestions,
  clearReelSuggestions,
};
