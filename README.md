# CC News India - Credit Card News Aggregator

A real-time news aggregation service for Indian credit card, points, and miles news. Built for **The Great Indian Points** channel to catch breaking news fast and create timely content.

Scans **69 sources** every 30 minutes: 43 Twitter/X accounts, 8 Reddit feeds, 12 Google News queries, 3 CC blogs, 3 finance news sites.

---

## Deploy in 3 Steps (Get a Live URL)

### Step 1: Fork this repo

Click the **Fork** button on GitHub to copy it to your account.

### Step 2: Deploy on Render.com (free)

1. Go to [render.com](https://render.com) and sign up (free, use GitHub login)
2. Click **New > Web Service**
3. Connect your GitHub account and select this repo
4. Render will auto-detect the settings. Just confirm:
   - **Branch:** `claude/credit-card-news-alerts-fONOU`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Click **Create Web Service**

Within 2-3 minutes you'll get a live URL like:
```
https://cc-news-india.onrender.com
```

Bookmark it. Open it anytime. Hit refresh for latest news.

### Step 3: Keep it scanning 24/7 (important!)

Render's free tier sleeps after 15 min of inactivity. To keep your scanner running:

1. Go to [cron-job.org](https://cron-job.org) (free, sign up with email)
2. Create a new cron job:
   - **URL:** `https://YOUR-APP.onrender.com/api/scan`
   - **Schedule:** Every 30 minutes
3. Save. Done.

This pings your app every 30 minutes, waking it up and triggering a fresh scan.

---

## Optional: Email Alerts to Gmail

To get email notifications when new articles are found:

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Generate an app password for "Mail"
3. In Render dashboard, go to your service > **Environment** tab, add:
   - `GMAIL_USER` = your-email@gmail.com
   - `GMAIL_APP_PASSWORD` = your-16-char-app-password
   - `ALERT_RECIPIENT` = your-email@gmail.com

Without this, the dashboard still works -- you just won't get email alerts.

---

## Dashboard Features

- Live news feed from 69 sources, newest first
- **Search** by keyword (e.g. "HDFC Infinia", "lounge access")
- **Filter buttons:** Credit Cards | Points & Miles | Twitter | Reddit | All
- **Platform badges** on each card (Reddit / Twitter / News / Blog)
- **Scan Now** button for instant refresh
- **Source stats** and **scan history** in sidebar
- **Auto-refreshes** every 5 minutes

---

## News Sources

### Twitter/X (43 accounts)

**Your picks:** @CardsavvyIndia, @ProfessorCardz, @suritalreja, @EvryPaisaMatter, @LiveFromALounge, @CardMavenIn, @akshat_money, @imYadav31, @TechnoFino, @CreditPedia, @nikravel, @Boopathy_SA, @MagnifyClub, @credofly, @savesage_club, @DoBaniye, @spendwiselyx, @pointperkspicks, @asktarunn, @AmazingCreditC, @milesmintIN, @chandrarsrikant, @luxe_explorer

**Additional influencers:** @AskTriMan, @cardinsider, @creditcardz_in, @credithelpindia, @CardExpert_in

**Bank handles (keyword-filtered):** @SBICard_Connect, @HDFCBank, @ICICIBank, @AxisBank, @GetOneCardIN, @AmexIndia, @aubank, @IDFCFIRSTBank, @IndusInd_Bank, @YesBank, @KotakBankLtd, @RBLBankLtd, @FederalBankLtd, @RuPay_npci, @RBI

### Reddit (8 feeds)

r/CreditCardsIndia, r/CreditCardIndia, r/IndianCreditCards, r/IndiaInvestments (filtered), r/india (filtered), plus 3 search queries

### Google News (12 queries)

Credit Card India, Rewards, New Launches, RBI Regulation, Amex, HDFC, SBI, ICICI, Axis Bank, Points & Miles, Loyalty Programs, Lounge Access

### Blogs & Finance

CardExpert.in, LiveFromALounge.com, CardInfo.in, Moneycontrol, Economic Times, NDTV Profit

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/articles?limit=50&q=hdfc` | Search/list articles as JSON |
| `GET /api/scan` | Trigger scan |
| `GET /api/stats` | Source stats and scan history |
| `GET /health` | Health check |

## Adding New Twitter Accounts

Edit `sources.js` and add:

```js
{
  name: 'Twitter - @handle',
  type: 'rss',
  url: 'https://xcancel.com/handle/rss',
  category: 'credit-card',
}
```

Push to GitHub and Render will auto-redeploy.

## Local Development

```bash
npm install
cp .env.example .env
npm start
# Open http://localhost:3000
```
