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

const REDDIT_HEADERS = {
  'User-Agent': 'CCNewsIndia/1.0 (Credit Card News Aggregator)',
  Accept: 'application/json',
};

function matchesKeywords(text) {
  const lower = (text || '').toLowerCase();
  return FILTER_KEYWORDS.some((kw) => lower.includes(kw));
}

function cleanHtml(html) {
  if (!html) return '';
  const $ = cheerio.load(html);
  return $.text().trim().substring(0, 500);
}

// --- RSS Scanner (Google News, blogs) ---
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

// --- Reddit JSON Scanner ---
async function scanRedditSource(source) {
  const articles = [];
  try {
    const resp = await axios.get(source.url, {
      headers: REDDIT_HEADERS,
      timeout: 15000,
    });

    const posts = resp.data?.data?.children || [];
    for (const child of posts) {
      const post = child.data;
      if (!post) continue;

      const title = (post.title || '').trim();
      const url = post.url_overridden_by_dest || `https://www.reddit.com${post.permalink}`;
      const selftext = (post.selftext || '').substring(0, 500);
      const permalink = `https://www.reddit.com${post.permalink}`;
      const publishedAt = post.created_utc
        ? new Date(post.created_utc * 1000).toISOString()
        : null;

      if (!title) continue;

      if (source.filterKeywords) {
        if (!matchesKeywords(title) && !matchesKeywords(selftext)) {
          continue;
        }
      }

      const summary = selftext || (post.url_overridden_by_dest ? `Link: ${post.url_overridden_by_dest}` : '');

      articles.push({
        url: permalink,
        title: `[Reddit] ${title}`,
        summary,
        source: source.name,
        category: source.category,
        publishedAt,
      });
    }
  } catch (err) {
    if (err.response?.status === 429) {
      console.error(`[Scanner] Reddit rate limited on ${source.name}. Will retry next scan.`);
    } else {
      console.error(`[Scanner] Error scanning ${source.name}: ${err.message}`);
    }
    return { articles: [], error: err.message };
  }
  return { articles, error: null };
}

// --- Main Scanner ---
async function runFullScan() {
  console.log(`[Scanner] Starting full scan at ${new Date().toISOString()}`);
  console.log(`[Scanner] Checking ${SOURCES.length} sources...`);

  let totalNew = 0;
  let sourcesChecked = 0;
  const errors = [];

  // Rate limiting for Reddit
  let lastRedditRequest = 0;
  const REDDIT_DELAY_MS = 2000;

  for (const source of SOURCES) {
    let result;

    if (source.type === 'reddit') {
      const elapsed = Date.now() - lastRedditRequest;
      if (elapsed < REDDIT_DELAY_MS && lastRedditRequest > 0) {
        await new Promise((r) => setTimeout(r, REDDIT_DELAY_MS - elapsed));
      }
      result = await scanRedditSource(source);
      lastRedditRequest = Date.now();
    } else if (source.type === 'rss') {
      result = await scanRssSource(source);
    } else {
      continue;
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
    console.log(`[Scanner] ${errors.length} errors encountered.`);
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

module.exports = { runFullScan, scanRssSource, scanRedditSource };
