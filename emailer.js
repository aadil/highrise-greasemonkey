const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const db = require('./db');

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[Emailer] Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function buildEmailHtml(articles) {
  const now = format(new Date(), 'dd MMM yyyy, hh:mm a');

  const categoryLabels = {
    'credit-card': '💳 Credit Card',
    'points-miles': '✈️ Points & Miles',
    'finance': '💰 Finance',
  };

  // Group articles by category
  const grouped = {};
  for (const a of articles) {
    const cat = a.category || 'credit-card';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  }

  let sections = '';
  for (const [cat, items] of Object.entries(grouped)) {
    const label = categoryLabels[cat] || cat;
    sections += `<h2 style="color:#1a73e8;border-bottom:2px solid #1a73e8;padding-bottom:8px;margin-top:24px;">${label}</h2>`;
    for (const a of items) {
      const pubDate = a.published_at ? format(new Date(a.published_at), 'dd MMM yyyy') : '';
      sections += `
        <div style="margin-bottom:16px;padding:12px;border-left:4px solid #1a73e8;background:#f8f9fa;">
          <a href="${a.url}" style="font-size:16px;font-weight:bold;color:#1a0dab;text-decoration:none;">${a.title}</a>
          <div style="color:#666;font-size:13px;margin-top:4px;">
            ${a.source}${pubDate ? ' · ' + pubDate : ''}
          </div>
          ${a.summary ? `<p style="color:#333;font-size:14px;margin-top:8px;">${a.summary.substring(0, 200)}${a.summary.length > 200 ? '...' : ''}</p>` : ''}
        </div>`;
    }
  }

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:24px;border-radius:12px 12px 0 0;color:white;">
        <h1 style="margin:0;font-size:22px;">🔔 Credit Card News Alert - India</h1>
        <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">${articles.length} new article${articles.length !== 1 ? 's' : ''} found · ${now}</p>
      </div>
      <div style="padding:16px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px;">
        ${sections}
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">
          The Great Indian Points · Credit Card News Aggregator<br>
          Scanned at ${now}
        </p>
      </div>
    </div>`;
}

async function sendAlertEmail(articles) {
  if (!articles || articles.length === 0) {
    console.log('[Emailer] No articles to email.');
    return false;
  }

  const transport = createTransport();
  if (!transport) return false;

  const recipient = process.env.ALERT_RECIPIENT || process.env.GMAIL_USER;
  if (!recipient) {
    console.warn('[Emailer] No recipient configured.');
    return false;
  }

  const subject = `[CC News] ${articles.length} new article${articles.length !== 1 ? 's' : ''} - ${format(new Date(), 'dd MMM yyyy')}`;

  try {
    await transport.sendMail({
      from: `"CC News India" <${process.env.GMAIL_USER}>`,
      to: recipient,
      subject,
      html: buildEmailHtml(articles),
    });
    console.log(`[Emailer] Alert sent to ${recipient} with ${articles.length} articles.`);
    return true;
  } catch (err) {
    console.error(`[Emailer] Failed to send email: ${err.message}`);
    return false;
  }
}

async function sendNewArticleAlerts() {
  const unmailed = db.getUnmailedArticles();
  if (unmailed.length === 0) {
    console.log('[Emailer] No new unmailed articles.');
    return;
  }

  const sent = await sendAlertEmail(unmailed);
  if (sent) {
    db.markAsEmailed(unmailed.map((a) => a.id));
    console.log(`[Emailer] Marked ${unmailed.length} articles as emailed.`);
  }
}

module.exports = { sendAlertEmail, sendNewArticleAlerts, buildEmailHtml };
