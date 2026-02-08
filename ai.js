const Anthropic = require('@anthropic-ai/sdk');
const db = require('./db');
const { FILTER_KEYWORDS } = require('./sources');

let client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

function isRelevantArticle(article) {
  const text = ((article.title || '') + ' ' + (article.summary || '')).toLowerCase();
  return FILTER_KEYWORDS.some(kw => text.includes(kw));
}

async function generateReelSuggestions() {
  const anthropic = getClient();
  if (!anthropic) {
    console.warn('[AI] No ANTHROPIC_API_KEY set. Skipping reel generation.');
    return [];
  }

  const allArticles = db.getArticlesFromLastDays(3);
  // Only send relevant credit card / points / miles articles to the AI
  const articles = allArticles.filter(isRelevantArticle);
  if (!articles || articles.length === 0) {
    console.log(`[AI] No relevant articles from last 3 days (${allArticles.length} total, 0 relevant). Skipping.`);
    return [];
  }

  console.log(`[AI] Generating reel suggestions from ${articles.length} relevant articles (${allArticles.length} total)...`);

  const articleList = articles.map((a, i) =>
    `${i + 1}. "${a.title}" (Source: ${a.source}, Published: ${a.published_at || 'Unknown'})\n   Summary: ${(a.summary || 'N/A').substring(0, 200)}`
  ).join('\n\n');

  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are the content strategist for "The Great Indian Points", a popular Indian credit card, points and miles social media channel that creates short-form video content (Instagram Reels / YouTube Shorts).

Today's date: ${today}

Here are the latest news articles from the past 3 days about credit cards, points, and miles in India:

${articleList}

Based on these articles, suggest the TOP reel ideas that would perform best TODAY. For each suggestion provide:

1. "title": A catchy, attention-grabbing reel title (max 10 words, use caps for emphasis)
2. "hook": The opening line to say on camera (must stop the scroll - create curiosity or urgency)
3. "script": A complete 30-35 second script for speaking on camera. Write it conversationally in Hinglish (mix of Hindi and English) as the audience is Indian. Structure: [0-5s] Hook, [5-20s] Key information, [20-30s] What viewers should do + call to action. Keep it punchy and fast-paced.
4. "justification": One line explaining why this reel MUST be made TODAY (urgency, timeliness, controversy, virality potential)
5. "source_indices": Array of article numbers (from the list above) that this reel is based on

Rules:
- Only suggest reels about genuinely NEW and CURRENT news (last 1-3 days)
- Skip generic "top 5 cards" or evergreen content - focus on BREAKING NEWS and timely updates
- Each script should be 30-35 seconds when spoken aloud at normal speed
- Make the hook irresistible - create FOMO, curiosity, or urgency
- Maximum 5 suggestions, minimum 1
- If articles are old/stale or not newsworthy, return FEWER suggestions rather than forcing bad ideas
- Prioritize: regulatory changes > card launches/devaluations > time-sensitive offers > trending discussions

Return ONLY a valid JSON array, no markdown fences, no explanation:
[{"title": "...", "hook": "...", "script": "...", "justification": "...", "source_indices": [1, 3]}]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    // Try to extract JSON even if there's extra text
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[AI] Could not parse JSON from response:', text.substring(0, 200));
      return [];
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Clear old suggestions and insert new ones
    db.clearReelSuggestions();

    for (const s of suggestions) {
      const sourceIds = (s.source_indices || []).map(i => {
        const article = articles[i - 1];
        return article ? article.id : null;
      }).filter(Boolean);

      const sourceHeadlines = (s.source_indices || []).map(i => {
        const article = articles[i - 1];
        return article ? { title: article.title, url: article.url } : null;
      }).filter(Boolean);

      db.insertReelSuggestion({
        title: s.title,
        hook: s.hook,
        script: s.script,
        justification: s.justification,
        sourceArticleIds: sourceIds,
        sourceHeadlines: sourceHeadlines,
      });
    }

    console.log(`[AI] Generated ${suggestions.length} reel suggestions.`);
    return suggestions;
  } catch (err) {
    console.error('[AI] Error generating reel suggestions:', err.message);
    return [];
  }
}

module.exports = { generateReelSuggestions };
