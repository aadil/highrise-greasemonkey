const RssParser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { SOURCES, FILTER_KEYWORDS } = require('./sources');
const db = require('./db');

const rssParser = new RssParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; CCNewsBot/1.0)',
  },
});

function matchesKeywords(text) {
  const lower = (text || '').toLowerCase();
  return FILTER_KEYWORDS.some((kw) => lower.includes(kw));
}

function cleanHtml(html) {
  if (!html) return '';
  const $ = cheerio.load(html);
  return $.text().trim().substring(0, 500);
}

async function scanRssSource(source) {
  const articles = [];
  try {
    const feed = await rssParser.parseURL(source.url);
    for (const item of feed.items || []) {
      const title = (item.title || '').trim();
      const url = (item.link || '').trim();
      const summary = cleanHtml(item.contentSnippet || item.content || item.summary || '');
      const publishedAt = item.isoDate || item.pubDate || null;

      if (!title || !url) continue;

      // If this source requires keyword filtering, check title + summary
      if (source.filterKeywords) {
        if (!matchesKeywords(title) && !matchesKeywords(summary)) {
          continue;
        }
      }

      articles.push({
        url,
        title,
        summary,
        source: source.name,
        category: source.category,
        publishedAt,
      });
    }
  } catch (err) {
    console.error(`[Scanner] Error scanning ${source.name}: ${err.message}`);
    return { articles: [], error: err.message };
  }
  return { articles, error: null };
}

async function runFullScan() {
  console.log(`[Scanner] Starting full scan at ${new Date().toISOString()}`);
  console.log(`[Scanner] Checking ${SOURCES.length} sources...`);

  let totalNew = 0;
  let sourcesChecked = 0;
  const errors = [];

  for (const source of SOURCES) {
    let result;
    if (source.type === 'rss') {
      result = await scanRssSource(source);
    } else {
      continue; // skip unknown types
    }

    sourcesChecked++;

    if (result.error) {
      errors.push(`${source.name}: ${result.error}`);
    }

    for (const article of result.articles) {
      const isNew = db.insertArticle(article);
      if (isNew) {
        totalNew++;
        console.log(`[Scanner] NEW: ${article.title} (${article.source})`);
      }
    }
  }

  const errorStr = errors.length ? errors.join('; ') : null;
  db.logScan(sourcesChecked, totalNew, errorStr);

  console.log(`[Scanner] Scan complete. Checked ${sourcesChecked} sources, found ${totalNew} new articles.`);
  if (errors.length) {
    console.log(`[Scanner] ${errors.length} errors: ${errorStr}`);
  }

  return { sourcesChecked, totalNew, errors };
}

// If run directly from command line
if (require.main === module) {
  runFullScan()
    .then((result) => {
      console.log(`\nDone. ${result.totalNew} new articles found.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runFullScan, scanRssSource };
