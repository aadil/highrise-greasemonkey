// News sources configuration for Indian credit card and points/miles news
// Each source has a type (rss, reddit, or twitter), URL, and category

const SOURCES = [
  // =============================================
  // REDDIT (highest priority - breaks news first)
  // =============================================
  {
    name: 'Reddit - r/CreditCardsIndia',
    type: 'reddit',
    url: 'https://www.reddit.com/r/CreditCardsIndia/new.json?limit=50',
    category: 'credit-card',
    filterKeywords: true,
  },
  {
    name: 'Reddit - r/IndiaInvestments (CC)',
    type: 'reddit',
    url: 'https://www.reddit.com/r/IndiaInvestments/new.json?limit=50',
    category: 'credit-card',
    filterKeywords: true,
  },
  {
    name: 'Reddit - r/india (CC)',
    type: 'reddit',
    url: 'https://www.reddit.com/r/india/new.json?limit=50',
    category: 'credit-card',
    filterKeywords: true,
  },
  {
    name: 'Reddit - r/CreditCardIndia',
    type: 'reddit',
    url: 'https://www.reddit.com/r/CreditCardIndia/new.json?limit=50',
    category: 'credit-card',
    filterKeywords: true,
  },
  {
    name: 'Reddit - r/IndianCreditCards',
    type: 'reddit',
    url: 'https://www.reddit.com/r/IndianCreditCards/new.json?limit=50',
    category: 'credit-card',
    filterKeywords: true,
  },
  // Reddit search queries for broader coverage
  {
    name: 'Reddit Search - Credit Card India',
    type: 'reddit',
    url: 'https://www.reddit.com/search.json?q=credit+card+india&sort=new&limit=25',
    category: 'credit-card',
  },
  {
    name: 'Reddit Search - HDFC Credit Card',
    type: 'reddit',
    url: 'https://www.reddit.com/search.json?q=HDFC+credit+card&sort=new&limit=25',
    category: 'credit-card',
  },
  {
    name: 'Reddit Search - Points Miles India',
    type: 'reddit',
    url: 'https://www.reddit.com/search.json?q=points+miles+india+credit+card&sort=new&limit=25',
    category: 'points-miles',
  },

  // =============================================
  // GOOGLE NEWS RSS (comprehensive web coverage)
  // Replaces dead Twitter/Nitter sources with broader Google News queries
  // =============================================
  {
    name: 'Google News - Credit Card India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=credit+card+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Credit Card Rewards India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=credit+card+rewards+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Credit Card Launch India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=credit+card+launch+India+new&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Credit Card RBI',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=credit+card+RBI+regulation&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Amex India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=American+Express+India+credit+card&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - HDFC Credit Card',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=HDFC+credit+card+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - SBI Credit Card',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=SBI+credit+card+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - ICICI Credit Card',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=ICICI+credit+card&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Axis Bank Credit Card',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=Axis+Bank+credit+card&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Points Miles India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=frequent+flyer+points+miles+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'points-miles',
  },
  {
    name: 'Google News - Loyalty Program India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=loyalty+program+India+airline+hotel&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'points-miles',
  },
  {
    name: 'Google News - Lounge Access India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=airport+lounge+access+credit+card+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  // Additional Google News queries (replacing dead Twitter/Nitter feeds)
  {
    name: 'Google News - Credit Card Devaluation',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=credit+card+devaluation+India+reward&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Credit Card Offer India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=credit+card+offer+India+2026&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - HDFC Infinia Diners',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=HDFC+Infinia+OR+Diners+credit+card&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Kotak IndusInd Credit Card',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=Kotak+OR+IndusInd+credit+card+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - OneCard IDFC Credit',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=OneCard+OR+IDFC+First+credit+card&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Marriott Bonvoy Taj India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=Marriott+Bonvoy+OR+Taj+Hotels+loyalty+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'points-miles',
  },
  {
    name: 'Google News - Air India Vistara Miles',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=Air+India+OR+Vistara+frequent+flyer+miles&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'points-miles',
  },
  {
    name: 'Google News - Annual Fee Waiver',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=credit+card+annual+fee+waiver+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - UPI Credit Card',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=UPI+credit+card+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Best Credit Card India',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=best+credit+card+India+2026&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - Credit Card News Today',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=credit+card+news+India+today&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },
  {
    name: 'Google News - RBI Credit Card Rules',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=RBI+credit+card+rules+regulation+India&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'credit-card',
  },

  // =============================================
  // INDIAN CC/FINANCE BLOGS (RSS)
  // =============================================
  {
    name: 'CardExpert',
    type: 'rss',
    url: 'https://cardexpert.in/feed/',
    category: 'credit-card',
  },
  {
    name: 'LiveFromALounge',
    type: 'rss',
    url: 'https://livefromalounge.com/feed/',
    category: 'points-miles',
  },
  {
    name: 'CardInfo',
    type: 'rss',
    url: 'https://cardinfo.in/feed/',
    category: 'credit-card',
  },

  // =============================================
  // MAJOR INDIAN FINANCE NEWS (keyword-filtered)
  // =============================================
  {
    name: 'Moneycontrol - Personal Finance',
    type: 'rss',
    url: 'https://www.moneycontrol.com/rss/MCtopnews.xml',
    category: 'finance',
    filterKeywords: true,
  },
  {
    name: 'Economic Times - Banking',
    type: 'rss',
    url: 'https://economictimes.indiatimes.com/industry/banking/finance/banking/rssfeeds/13358259.cms',
    category: 'finance',
    filterKeywords: true,
  },
  {
    name: 'NDTV Profit',
    type: 'rss',
    url: 'https://feeds.feedburner.com/ndtvprofit-latest',
    category: 'finance',
    filterKeywords: true,
  },
];

// Keywords to filter articles from general finance/bank sources
const FILTER_KEYWORDS = [
  'credit card',
  'creditcard',
  'debit card',
  'reward point',
  'reward program',
  'loyalty point',
  'loyalty program',
  'lounge access',
  'frequent flyer',
  'air miles',
  'airline miles',
  'hotel points',
  'cashback',
  'cash back',
  'annual fee',
  'joining fee',
  'credit limit',
  'emi',
  'rupay',
  'visa card',
  'mastercard',
  'amex',
  'american express',
  'hdfc card',
  'sbi card',
  'icici card',
  'axis card',
  'kotak card',
  'yes bank card',
  'indusind card',
  'au bank card',
  'idfc card',
  'rbl card',
  'citi card',
  'diners club',
  'infinia',
  'regalia',
  'millennia',
  'swiggy card',
  'flipkart card',
  'amazon card',
  'onecard',
  'fi card',
  'jupiter card',
  'slice card',
  'uni card',
  'cred',
  'marriott bonvoy',
  'vistara',
  'air india',
  'club vistara',
  'intermiles',
  'taj hotel',
  'ihg',
  'hilton honors',
  'accor',
  'reward rate',
  'milestone benefit',
  'welcome benefit',
  'spend based',
  'rbi credit',
  'rbi card',
  'mdr',
  'interchange fee',
  'upi credit',
  'tokenization',
  'co-branded card',
  'super premium card',
  'metal card',
];

module.exports = { SOURCES, FILTER_KEYWORDS };
