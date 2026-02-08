# CC News India - Credit Card News Aggregator

A real-time news aggregation service for Indian credit card, points, and miles news. Built for **The Great Indian Points** channel to catch breaking news fast and create timely content.

## What It Does

- Scans **69 sources** every 30 minutes (configurable): 43 Twitter/X accounts, 8 Reddit feeds, 12 Google News queries, 3 CC blogs, 3 finance news sites
- **Web dashboard** at `http://localhost:3000` to browse, search, and filter articles
- **Gmail email alerts** when new articles are found
- **SQLite database** for deduplication and history
- **REST API** for programmatic access

## News Sources

### Twitter/X (43 accounts via xcancel.com RSS)

**Your picks:** @CardsavvyIndia, @ProfessorCardz, @suritalreja, @EvryPaisaMatter, @LiveFromALounge, @CardMavenIn, @akshat_money, @imYadav31, @TechnoFino, @CreditPedia, @nikravel, @Boopathy_SA, @MagnifyClub, @credofly, @savesage_club, @DoBaniye, @spendwiselyx, @pointperkspicks, @asktarunn, @AmazingCreditC, @milesmintIN, @chandrarsrikant, @luxe_explorer

**Additional influencers:** @AskTriMan, @cardinsider, @creditcardz_in, @credithelpindia, @CardExpert_in

**Bank & institutional handles (keyword-filtered):** @SBICard_Connect, @HDFCBank, @ICICIBank, @AxisBank, @GetOneCardIN, @AmexIndia, @aubank, @IDFCFIRSTBank, @IndusInd_Bank, @YesBank, @KotakBankLtd, @RBLBankLtd, @FederalBankLtd, @RuPay_npci, @RBI

### Reddit (8 feeds)

| Source | Type |
|--------|------|
| r/CreditCardsIndia (new posts) | JSON API |
| r/CreditCardIndia (new posts) | JSON API |
| r/IndianCreditCards (new posts) | JSON API |
| r/IndiaInvestments (keyword-filtered) | JSON API |
| r/india (keyword-filtered) | JSON API |
| Reddit Search: "credit card india" | JSON API |
| Reddit Search: "HDFC credit card" | JSON API |
| Reddit Search: "points miles india" | JSON API |

### Google News RSS (12 India-specific queries)

Credit Card India, Rewards, New Launches, RBI Regulation, Amex, HDFC, SBI, ICICI, Axis Bank, Points & Miles, Loyalty Programs, Lounge Access

### Blogs & Finance News

| Source | Type |
|--------|------|
| CardExpert.in | RSS |
| LiveFromALounge.com | RSS |
| CardInfo.in | RSS |
| Moneycontrol (keyword-filtered) | RSS |
| Economic Times - Banking (keyword-filtered) | RSS |
| NDTV Profit (keyword-filtered) | RSS |

General finance sources are keyword-filtered to only surface credit card / points / miles articles. See `sources.js` to add or modify sources.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your Gmail credentials (see Email Setup below)

# 3. Start the server (dashboard + scheduler)
npm start

# 4. Open the dashboard
open http://localhost:3000
```

## Email Setup (Gmail)

To receive email alerts:

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Generate a new app password for "Mail"
3. Add to your `.env`:

```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcd-efgh-ijkl-mnop
ALERT_RECIPIENT=your-email@gmail.com
```

Without email configured, the dashboard and scanner still work -- you just won't get email alerts.

## Configuration (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `GMAIL_USER` | - | Your Gmail address |
| `GMAIL_APP_PASSWORD` | - | Gmail App Password (16 chars) |
| `ALERT_RECIPIENT` | Same as GMAIL_USER | Where to send alerts |
| `SCAN_INTERVAL_MINUTES` | `30` | How often to scan |
| `PORT` | `3000` | Dashboard port |

## Usage

### Dashboard

Visit `http://localhost:3000` after starting. Features:
- **Search** articles by keyword
- **Filter** by category (Credit Cards, Points & Miles, All)
- **Scan Now** button to trigger an immediate scan
- **Source stats** and **scan history** in the sidebar
- Auto-refreshes every 5 minutes

### Manual Scan (CLI)

```bash
node scanner.js
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/articles?limit=50&offset=0&q=hdfc` | List/search articles |
| `GET /api/scan` | Trigger scan, returns results as JSON |
| `GET /api/stats` | Source stats and scan history |

## Project Structure

```
server.js     - Express server, dashboard, scheduler
scanner.js    - RSS feed scanner
emailer.js    - Gmail notification sender
db.js         - SQLite database layer
sources.js    - News source configuration + filter keywords
.env.example  - Environment variable template
```

## Adding New Sources

Edit `sources.js` to add RSS feeds:

```js
{
  name: 'My New Source',
  type: 'rss',
  url: 'https://example.com/feed/',
  category: 'credit-card',   // or 'points-miles' or 'finance'
  filterKeywords: false,      // set true for general sources
}
```

## Running in Production

For always-on operation, use PM2 or systemd:

```bash
# With PM2
npm install -g pm2
pm2 start server.js --name cc-news
pm2 save
pm2 startup

# Or with systemd, nohup, screen, etc.
```

## Keywords Monitored

The filter catches articles mentioning: credit cards, reward points, loyalty programs, lounge access, specific Indian bank cards (HDFC, SBI, ICICI, Axis, Kotak, etc.), fintech cards (OneCard, Fi, Jupiter, Slice), programs (InterMiles, Club Vistara, Marriott Bonvoy), RBI regulations, UPI credit, and more. Full list in `sources.js`.
