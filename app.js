/**
 * Self Finance — household ledger & NEPSE market watch
 */
(function () {
  'use strict';

  const PALETTE = {
    brass: '#f2bd43',
    forest: '#48d98a',
    ink: '#25c6d9',
    amber: '#f2bd43',
    plum: '#a58af5',
    rose: '#f07883',
    teal: '#25c6d9',
    blush: '#ea78bb'
  };

  const DEFAULT_MARKET_ASSETS = [
    { id: 'nepse', symbol: 'NEPSE', name: 'NEPSE Index', category: 'indices', isIndex: true, priceNPR: 2842.60, changePct: 1.24, changeNPR: 34.80, dayLow: 2807.8, dayHigh: 2855.2, cap: 'Rs 4,512.4B', history: [2760, 2785, 2792, 2810, 2824, 2835, 2842.6] },
    { id: 'sensitive', symbol: 'SENSITIVE', name: 'Sensitive (Class A)', category: 'indices', isIndex: true, priceNPR: 496.30, changePct: 0.98, changeNPR: 4.80, dayLow: 491.5, dayHigh: 498.0, cap: '—', history: [488, 490, 492, 491, 494, 495, 496.3] },
    { id: 'banking_idx', symbol: 'BANKING', name: 'Banking sub-index', category: 'indices', isIndex: true, priceNPR: 1482.40, changePct: 1.28, changeNPR: 18.70, dayLow: 1463.7, dayHigh: 1490.5, cap: '—', history: [1440, 1452, 1458, 1465, 1472, 1478, 1482.4] },
    { id: 'hydro_idx', symbol: 'HYDRO', name: 'Hydropower sub-index', category: 'indices', isIndex: true, priceNPR: 3248.10, changePct: 2.15, changeNPR: 68.40, dayLow: 3179.7, dayHigh: 3265.0, cap: '—', history: [3110, 3140, 3180, 3165, 3210, 3230, 3248.1] },
    { id: 'nabil', symbol: 'NABIL', name: 'Nabil Bank', category: 'banks', isIndex: false, priceNPR: 628.00, changePct: 1.80, changeNPR: 11.10, dayLow: 616.9, dayHigh: 632.0, cap: 'Rs 169.8B', history: [608, 612, 615, 618, 622, 625, 628] },
    { id: 'gbime', symbol: 'GBIME', name: 'Global IME Bank', category: 'banks', isIndex: false, priceNPR: 248.50, changePct: 0.65, changeNPR: 1.60, dayLow: 246.0, dayHigh: 251.0, cap: 'Rs 89.7B', history: [242, 244, 245, 247, 246, 248, 248.5] },
    { id: 'nica', symbol: 'NICA', name: 'NIC Asia Bank', category: 'banks', isIndex: false, priceNPR: 482.00, changePct: -0.41, changeNPR: -2.00, dayLow: 480.0, dayHigh: 488.0, cap: 'Rs 71.9B', history: [490, 488, 485, 487, 486, 484, 482] },
    { id: 'ebl', symbol: 'EBL', name: 'Everest Bank', category: 'banks', isIndex: false, priceNPR: 580.00, changePct: 1.75, changeNPR: 10.00, dayLow: 570.0, dayHigh: 585.0, cap: 'Rs 68.4B', history: [560, 565, 568, 572, 575, 578, 580] },
    { id: 'scb', symbol: 'SCB', name: 'Standard Chartered Nepal', category: 'banks', isIndex: false, priceNPR: 615.00, changePct: 2.10, changeNPR: 12.60, dayLow: 602.4, dayHigh: 620.0, cap: 'Rs 57.8B', history: [592, 598, 602, 605, 610, 612, 615] },
    { id: 'upper', symbol: 'UPPER', name: 'Upper Tamakoshi', category: 'hydro', isIndex: false, priceNPR: 272.00, changePct: 4.25, changeNPR: 11.10, dayLow: 260.9, dayHigh: 276.0, cap: 'Rs 57.1B', history: [248, 252, 258, 260, 265, 268, 272] },
    { id: 'chcl', symbol: 'CHCL', name: 'Chilime Hydropower', category: 'hydro', isIndex: false, priceNPR: 524.00, changePct: 1.15, changeNPR: 5.95, dayLow: 518.0, dayHigh: 529.0, cap: 'Rs 41.8B', history: [508, 512, 515, 519, 520, 522, 524] },
    { id: 'shpc', symbol: 'SHPC', name: 'Sanima Mai', category: 'hydro', isIndex: false, priceNPR: 348.00, changePct: 2.35, changeNPR: 8.00, dayLow: 340.0, dayHigh: 352.0, cap: 'Rs 11.5B', history: [332, 336, 340, 338, 342, 345, 348] },
    { id: 'bpcl', symbol: 'BPCL', name: 'Butwal Power', category: 'hydro', isIndex: false, priceNPR: 385.00, changePct: 0.78, changeNPR: 3.00, dayLow: 382.0, dayHigh: 390.0, cap: 'Rs 13.1B', history: [375, 378, 380, 382, 383, 384, 385] },
    { id: 'nric', symbol: 'NRIC', name: 'Nepal Reinsurance', category: 'insurance', isIndex: false, priceNPR: 855.00, changePct: 3.05, changeNPR: 25.30, dayLow: 830.0, dayHigh: 865.0, cap: 'Rs 110.2B', history: [810, 822, 828, 835, 842, 848, 855] },
    { id: 'hrl', symbol: 'HRL', name: 'Himalayan Reinsurance', category: 'insurance', isIndex: false, priceNPR: 724.00, changePct: 2.45, changeNPR: 17.30, dayLow: 706.7, dayHigh: 732.0, cap: 'Rs 72.4B', history: [685, 694, 702, 710, 715, 719, 724] },
    { id: 'nlic', symbol: 'NLIC', name: 'Nepal Life Insurance', category: 'insurance', isIndex: false, priceNPR: 685.00, changePct: 1.05, changeNPR: 7.10, dayLow: 677.9, dayHigh: 692.0, cap: 'Rs 56.2B', history: [668, 672, 675, 679, 680, 682, 685] },
    { id: 'cbbl', symbol: 'CBBL', name: 'Chhimek Laghubitta', category: 'microfinance', isIndex: false, priceNPR: 995.00, changePct: 1.65, changeNPR: 16.15, dayLow: 978.8, dayHigh: 1005.0, cap: 'Rs 29.6B', history: [955, 965, 972, 980, 988, 990, 995] },
    { id: 'skbbl', symbol: 'SKBBL', name: 'Sana Kisan Bikas', category: 'microfinance', isIndex: false, priceNPR: 880.00, changePct: 0.92, changeNPR: 8.00, dayLow: 872.0, dayHigh: 888.0, cap: 'Rs 28.1B', history: [858, 864, 869, 872, 875, 878, 880] },
    { id: 'ntc', symbol: 'NTC', name: 'Nepal Telecom', category: 'others', isIndex: false, priceNPR: 892.00, changePct: 0.45, changeNPR: 4.00, dayLow: 888.0, dayHigh: 898.0, cap: 'Rs 160.5B', history: [880, 884, 885, 887, 890, 891, 892] },
    { id: 'shivm', symbol: 'SHIVM', name: 'Shivam Cement', category: 'others', isIndex: false, priceNPR: 542.00, changePct: 5.12, changeNPR: 26.40, dayLow: 515.6, dayHigh: 550.0, cap: 'Rs 29.3B', history: [498, 506, 515, 524, 530, 536, 542] },
    { id: 'hdl', symbol: 'HDL', name: 'Himalayan Distillery', category: 'others', isIndex: false, priceNPR: 1648.00, changePct: -1.20, changeNPR: -20.00, dayLow: 1640.0, dayHigh: 1680.0, cap: 'Rs 38.6B', history: [1690, 1680, 1675, 1668, 1660, 1655, 1648] },
    { id: 'cit', symbol: 'CIT', name: 'Citizen Investment Trust', category: 'others', isIndex: false, priceNPR: 2360.00, changePct: 0.80, changeNPR: 18.70, dayLow: 2341.3, dayHigh: 2380.0, cap: 'Rs 125.1B', history: [2310, 2325, 2335, 2345, 2350, 2355, 2360] }
  ];

  const state = {
    user: null,
    apiToken: '',
    accounts: [],
    categories: [],
    lastSyncedAt: null,
    currentView: 'overview',
    currentCurrency: 'NPR',
    currentTheme: 'dark',
    activeTimeframe: '1Y',
    analyticsRange: 'ytd',
    exchangeRates: {
      NPR: { rate: 1.0, symbol: 'Rs ', code: 'NPR' }
    },
    metrics: {
      netWorthNPR: 168450000.0,
      monthlyIncomeNPR: 3450000.0,
      monthlyExpenseNPR: 1630000.0,
      savingsRate: 52.8,
      healthScore: 94
    },
    assetAllocations: [
      { name: 'NEPSE equities & funds', amountNPR: 87500000, color: PALETTE.brass, pct: 51.9 },
      { name: 'Kathmandu commercial RE', amountNPR: 43200000, color: PALETTE.forest, pct: 25.6 },
      { name: 'FDs & cash', amountNPR: 17350000, color: PALETTE.ink, pct: 10.3 },
      { name: 'Hydropower promoter', amountNPR: 14900000, color: PALETTE.amber, pct: 8.8 },
      { name: 'Govt. development bonds', amountNPR: 5500000, color: PALETTE.plum, pct: 3.4 }
    ],
    expenseCategories: [
      {
        id: 'housing', name: 'Housing & Rent', icon: 'home', colorClass: 'bg-housing',
        hexColor: PALETTE.forest, spentNPR: 380000, capNPR: 420000,
        subitems: [
          { name: 'Baluwatar rent', amountNPR: 320000 },
          { name: 'Society', amountNPR: 35000 },
          { name: 'Repairs', amountNPR: 25000 }
        ]
      },
      {
        id: 'food', name: 'Food & Groceries', icon: 'utensils', colorClass: 'bg-food',
        hexColor: PALETTE.amber, spentNPR: 165000, capNPR: 200000,
        subitems: [
          { name: 'Bhatbhateni', amountNPR: 85000 },
          { name: 'Produce', amountNPR: 38000 },
          { name: 'Dining', amountNPR: 42000 }
        ]
      },
      {
        id: 'education', name: 'Education & Tuition', icon: 'graduation-cap', colorClass: 'bg-education',
        hexColor: PALETTE.ink, spentNPR: 145000, capNPR: 180000,
        subitems: [
          { name: 'Semester fees', amountNPR: 110000 },
          { name: 'Books', amountNPR: 15000 },
          { name: 'Courses', amountNPR: 20000 }
        ]
      },
      {
        id: 'health', name: 'Health & Medical Care', icon: 'heart-pulse', colorClass: 'bg-health',
        hexColor: PALETTE.rose, spentNPR: 95000, capNPR: 130000,
        subitems: [
          { name: 'Norvic checkup', amountNPR: 45000 },
          { name: 'Pharmacy', amountNPR: 22000 },
          { name: 'Insurance', amountNPR: 28000 }
        ]
      },
      {
        id: 'utilities', name: 'Utilities & Bills', icon: 'zap', colorClass: 'bg-utilities',
        hexColor: PALETTE.teal, spentNPR: 65000, capNPR: 85000,
        subitems: [
          { name: 'NEA', amountNPR: 28000 },
          { name: 'WorldLink', amountNPR: 14000 },
          { name: 'KUKL', amountNPR: 12000 },
          { name: 'NTC', amountNPR: 11000 }
        ]
      },
      {
        id: 'transport', name: 'Transport & Fuel', icon: 'car', colorClass: 'bg-transport',
        hexColor: PALETTE.plum, spentNPR: 85000, capNPR: 120000,
        subitems: [
          { name: 'Fuel', amountNPR: 48000 },
          { name: 'Service', amountNPR: 22000 },
          { name: 'Rides', amountNPR: 15000 }
        ]
      },
      {
        id: 'investments', name: 'NEPSE & Investments', icon: 'line-chart', colorClass: 'bg-investments',
        hexColor: PALETTE.brass, spentNPR: 450000, capNPR: 600000,
        subitems: [
          { name: 'Broker 58 buys', amountNPR: 300000 },
          { name: 'Rights', amountNPR: 100000 },
          { name: 'SIP', amountNPR: 50000 }
        ]
      },
      {
        id: 'shopping', name: 'Shopping & Lifestyle', icon: 'shopping-bag', colorClass: 'bg-shopping',
        hexColor: PALETTE.blush, spentNPR: 110000, capNPR: 160000,
        subitems: [
          { name: 'Apparel', amountNPR: 55000 },
          { name: 'Gadgets', amountNPR: 35000 },
          { name: 'Gym', amountNPR: 20000 }
        ]
      },
      {
        id: 'entertainment', name: 'Entertainment & Travel', icon: 'plane', colorClass: 'bg-entertainment',
        hexColor: PALETTE.amber, spentNPR: 75000, capNPR: 110000,
        subitems: [
          { name: 'Nagarkot', amountNPR: 45000 },
          { name: 'QFX', amountNPR: 12000 },
          { name: 'Streaming', amountNPR: 18000 }
        ]
      },
      {
        id: 'family', name: 'Family & Festivals', icon: 'gift', colorClass: 'bg-family',
        hexColor: PALETTE.forest, spentNPR: 60000, capNPR: 90000,
        subitems: [
          { name: 'Puja', amountNPR: 35000 },
          { name: 'Gifts', amountNPR: 15000 },
          { name: 'Giving', amountNPR: 10000 }
        ]
      }
    ],
    cashflow: {
      ytd: {
        labels: ['Falgun', 'Chaitra', 'Baisakh', 'Jestha', 'Ashadh', 'Shrawan'],
        inflow: [2800000, 3100000, 3250000, 2980000, 3400000, 3450000],
        outflow: [1380000, 1420000, 1550000, 1480000, 1590000, 1630000]
      },
      t12: {
        labels: ['Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra', 'Baisakh', 'Jestha', 'Ashadh', 'Shrawan'],
        inflow: [2400000, 2550000, 2600000, 2700000, 2850000, 2900000, 2800000, 3100000, 3250000, 2980000, 3400000, 3450000],
        outflow: [1200000, 1250000, 1280000, 1310000, 1350000, 1360000, 1380000, 1420000, 1550000, 1480000, 1590000, 1630000]
      }
    },
    timeframeData: {
      '1W': {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        values: [166500000, 166900000, 167400000, 167100000, 167900000, 168200000, 168450000]
      },
      '1M': {
        labels: ['W1', 'W2', 'W3', 'W4'],
        values: [163800000, 165200000, 166900000, 168450000]
      },
      '6M': {
        labels: ['Falgun', 'Chaitra', 'Baisakh', 'Jestha', 'Ashadh', 'Shrawan'],
        values: [149000000, 153500000, 158000000, 162200000, 165800000, 168450000]
      },
      '1Y': {
        labels: ['Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra', 'Baisakh', 'Jestha', 'Ashadh', 'Shrawan'],
        values: [132000000, 136000000, 139500000, 143000000, 147500000, 151000000, 155000000, 159000000, 162500000, 164500000, 166800000, 168450000]
      },
      ALL: {
        labels: ['2079', '2080', '2081', '2082', '2083'],
        values: [72000000, 96000000, 122000000, 145000000, 168450000]
      }
    },
    marketAssets: DEFAULT_MARKET_ASSETS.map((a) => Object.assign({}, a, { history: a.history.slice() })),
    transactions: [
      { id: 'tx-001', date: '2026-08-14', desc: 'Baluwatar rent & society', category: 'Housing & Rent', account: 'Nabil Bank Direct (...4819)', amountNPR: 320000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-002', date: '2026-08-13', desc: 'Bhatbhateni groceries', category: 'Food & Groceries', account: 'NIC Asia Platinum (...1004)', amountNPR: 85000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-003', date: '2026-08-12', desc: 'Kathmandu University semester', category: 'Education & Tuition', account: 'Global IME Account (...9201)', amountNPR: 110000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-004', date: '2026-08-11', desc: 'Norvic comprehensive checkup', category: 'Health & Medical Care', account: 'NIC Asia Platinum (...1004)', amountNPR: 45000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-005', date: '2026-08-10', desc: 'NEA bill & EV charging', category: 'Utilities & Bills', account: 'Nabil Bank Direct (...4819)', amountNPR: 28000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-006', date: '2026-08-09', desc: 'Fuel and servicing', category: 'Transport & Fuel', account: 'NIC Asia Platinum (...1004)', amountNPR: 48000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-007', date: '2026-08-08', desc: 'TMS buys UPPER, HRL, NABIL', category: 'NEPSE & Investments', account: 'Nabil Bank Direct (...4819)', amountNPR: 300000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-008', date: '2026-08-07', desc: 'Clothing and gym', category: 'Shopping & Lifestyle', account: 'NIC Asia Platinum (...1004)', amountNPR: 55000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-009', date: '2026-08-06', desc: 'Nagarkot weekend', category: 'Entertainment & Travel', account: 'NIC Asia Platinum (...1004)', amountNPR: 45000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-010', date: '2026-08-05', desc: 'Festival puja and gifts', category: 'Family & Festivals', account: 'Nabil Bank Direct (...4819)', amountNPR: 35000.00, type: 'debit', status: 'Completed' },
      { id: 'tx-011', date: '2026-08-04', desc: 'NABIL cash dividend', category: 'Income', account: 'Nabil Bank Direct (...4819)', amountNPR: 68500.00, type: 'credit', status: 'Completed' },
      { id: 'tx-012', date: '2026-08-03', desc: 'Consulting retainer', category: 'Income', account: 'Global IME Account (...9201)', amountNPR: 2450000.00, type: 'credit', status: 'Completed' },
      { id: 'tx-013', date: '2026-08-02', desc: 'Commercial rent yield', category: 'Income', account: 'Nabil Bank Direct (...4819)', amountNPR: 750000.00, type: 'credit', status: 'Completed' },
      { id: 'tx-014', date: '2026-08-01', desc: 'NTC dividend', category: 'Income', account: 'Nabil Bank Direct (...4819)', amountNPR: 142000.00, type: 'credit', status: 'Completed' }
    ],
    goals: [
      { id: 'g1', title: 'NEPSE blue-chip sleeve', targetNPR: 120000000, currentNPR: 87500000, date: '2026-12-31', color: 'emerald' },
      { id: 'g2', title: 'Pokhara lakeside land', targetNPR: 35000000, currentNPR: 24500000, date: '2027-06-30', color: 'indigo' },
      { id: 'g3', title: 'Hydro promoter pool', targetNPR: 20000000, currentNPR: 14900000, date: '2027-01-15', color: 'amber' },
      { id: 'g4', title: 'Education trust', targetNPR: 15000000, currentNPR: 9500000, date: '2028-09-01', color: 'emerald' }
    ],
    txPagination: { currentPage: 1, pageSize: 8 },
    txFilters: { search: '', category: 'all', type: 'all', status: 'all' },
    marketSearch: '',
    marketCategory: 'all'
  };

  let portfolioChartInstance = null;
  let assetDonutChartInstance = null;
  let cashflowChartInstance = null;
  let expenseCatChartInstance = null;
  let projectionChartInstance = null;
  let tickTimer = null;
  let marketTickTimer = null;

  function apiRequest(path, options) {
    const requestOptions = Object.assign({ credentials: 'same-origin' }, options || {});
    const headers = Object.assign({ 'Content-Type': 'application/json' }, requestOptions.headers || {});
    if (state.apiToken) headers.Authorization = `Bearer ${state.apiToken}`;
    return fetch(path, Object.assign({}, requestOptions, { headers })).then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${response.status})`);
      }
      return response.status === 204 ? null : response.json();
    });
  }

  function clearDemoState() {
    state.metrics = { netWorthNPR: 0, monthlyIncomeNPR: 0, monthlyExpenseNPR: 0, savingsRate: 0, healthScore: 0 };
    state.assetAllocations = [];
    state.expenseCategories = [];
    state.transactions = [];
    state.goals = [];
    state.marketAssets = [];
    state.cashflow = { ytd: { labels: [], inflow: [], outflow: [] }, t12: { labels: [], inflow: [], outflow: [] } };
    state.timeframeData = Object.fromEntries(['1W', '1M', '6M', '1Y', 'ALL'].map((key) => [key, { labels: [], values: [] }]));
  }

  async function loadMarketData() {
    try {
      const assets = await apiRequest('/api/market');
      if (Array.isArray(assets) && assets.length) {
        state.marketAssets = assets.map((asset) => ({
          ...asset,
          history: Array.isArray(asset.history) && asset.history.length ? asset.history.slice() : [Number(asset.priceNPR) || 0]
        }));
        const marketStatus = document.getElementById('market-feed-status');
        if (marketStatus) {
          const asset = assets[0];
          const sourceTime = asset.sourceTimestamp ? `as of ${asset.sourceTimestamp} NPT` : 'source time unavailable';
          const fetchedTime = asset.fetchedAt ? ` · checked ${new Date(asset.fetchedAt).toLocaleTimeString()}` : '';
          marketStatus.textContent = `${asset.marketStatus || 'Market status unavailable'} · ${sourceTime}${fetchedTime}`;
        }
        renderMiniMarketTable();
        renderFullMarketTable();
      }
    } catch (error) {
      const marketStatus = document.getElementById('market-feed-status');
      if (marketStatus) marketStatus.textContent = 'Market feed unavailable · retrying';
    }
  }

  async function loadLiveLedger() {
    const [summary, accounts, categories, transactions] = await Promise.all([
      apiRequest('/api/summary'), apiRequest('/api/accounts'), apiRequest('/api/categories'),
      apiRequest('/api/transactions?limit=500')
    ]);
    state.accounts = accounts;
    state.categories = categories;
    const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    state.transactions = transactions.map((transaction) => ({
      id: String(transaction.id),
      date: transaction.transaction_date,
      desc: transaction.description,
      category: transaction.type === 'transfer' ? 'Transfer' : (categoryNames.get(transaction.category_id) || 'Uncategorized'),
      account: transaction.type === 'transfer'
        ? `${accountNames.get(transaction.account_id) || 'Account'} → ${accountNames.get(transaction.destination_account_id) || 'Account'}`
        : (accountNames.get(transaction.account_id) || 'Account'),
      amountNPR: Number(transaction.amount),
      type: transaction.type === 'income' ? 'credit' : transaction.type === 'expense' ? 'debit' : 'transfer',
      status: transaction.status === 'posted' ? 'Completed' : 'Pending'
    }));
    state.metrics.netWorthNPR = Number(summary.account_balance);
    state.metrics.monthlyIncomeNPR = Number(summary.monthly_income);
    state.metrics.monthlyExpenseNPR = Number(summary.monthly_expense);
    recalcSavings();
    const spendingByCategory = new Map();
    const month = summary.month_start.slice(0, 7);
    state.transactions.filter((tx) => tx.type === 'debit' && tx.status === 'Completed' && tx.date.startsWith(month)).forEach((tx) => {
      spendingByCategory.set(tx.category, (spendingByCategory.get(tx.category) || 0) + tx.amountNPR);
    });
    state.expenseCategories = Array.from(spendingByCategory, ([name, spentNPR]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, icon: 'receipt',
      colorClass: 'bg-food', hexColor: PALETTE.teal, spentNPR, capNPR: 0, subitems: []
    }));
    const positiveAccounts = accounts.filter((account) => Number(account.current_balance) > 0);
    const positiveTotal = positiveAccounts.reduce((sum, account) => sum + Number(account.current_balance), 0);
    state.assetAllocations = positiveAccounts.map((account, index) => ({
      name: account.name,
      amountNPR: Number(account.current_balance),
      color: [PALETTE.brass, PALETTE.forest, PALETTE.ink, PALETTE.amber][index % 4],
      pct: positiveTotal ? Number((Number(account.current_balance) / positiveTotal * 100).toFixed(1)) : 0
    }));
    populateLedgerOptions();
    state.lastSyncedAt = new Date();
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) syncStatus.textContent = `Ledger synced ${state.lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    updateKpiCards();
    renderRecentTransactions();
    renderFullTransactionsTable();
    loadPersistedGoals();
    renderGoalsAndBudgets();
    renderAccounts();
    refreshAllCharts();
  }

  function updateTxCategoryOptions() {
    const transactionCategory = document.getElementById('tx-category');
    if (!transactionCategory) return;
    const currentUiType = document.getElementById('tx-type')?.value || 'debit';
    const targetKind = currentUiType === 'credit' ? 'income' : 'expense';
    const relevantCategories = state.categories.filter((c) => c.type === targetKind);
    const displayCategories = relevantCategories.length ? relevantCategories : state.categories;
    const selected = transactionCategory.value;
    transactionCategory.innerHTML = displayCategories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join('');
    if (displayCategories.some((c) => String(c.id) === selected)) {
      transactionCategory.value = selected;
    }
  }

  function populateLedgerOptions() {
    const selectedCategory = document.getElementById('tx-category-filter')?.value || 'all';
    updateTxCategoryOptions();
    const filterCategory = document.getElementById('tx-category-filter');
    if (filterCategory) {
      filterCategory.innerHTML = '<option value="all">All</option>' + state.categories.map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`).join('');
      filterCategory.value = selectedCategory;
    }
    const accountOptions = state.accounts.map((account) => `<option value="${account.id}">${escapeHtml(account.name)} (${formatCurrency(Number(account.current_balance))})</option>`).join('');
    ['tx-account', 'transfer-from', 'transfer-to'].forEach((id) => {
      const select = document.getElementById(id);
      if (select) {
        const selected = select.value;
        select.innerHTML = accountOptions;
        if (state.accounts.some((account) => String(account.id) === selected)) select.value = selected;
      }
    });
    const transferTo = document.getElementById('transfer-to');
    if (transferTo && state.accounts.length > 1) transferTo.selectedIndex = 1;
  }

  function renderAccounts() {
    const tbody = document.getElementById('accounts-tbody');
    const empty = document.getElementById('accounts-empty');
    if (!tbody) return;
    tbody.innerHTML = state.accounts.map((account) => `
      <tr><td><strong>${escapeHtml(account.name)}</strong></td><td>${escapeHtml(account.account_type.replace('_', ' '))}</td>
      <td>${escapeHtml(account.institution || '—')}</td><td class="tabular font-bold">${formatCurrency(Number(account.current_balance))}</td></tr>
    `).join('');
    if (empty) empty.classList.toggle('hidden', state.accounts.length > 0);
  }

  function removeLegacyLocalAuthData() {
    try {
      localStorage.removeItem('self_finance_users');
      localStorage.removeItem('self_finance_session');
    } catch (e) {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }

  function readBrowserStorage(storageName, key, fallback = '') {
    try {
      return window[storageName].getItem(key) ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeBrowserStorage(storageName, key, value) {
    try {
      window[storageName].setItem(key, value);
    } catch {}
  }

  function removeBrowserStorage(storageName, key) {
    try {
      window[storageName].removeItem(key);
    } catch {}
  }

  function loadPersistedGoals() {
    const userId = state.user?.id || 'default';
    try {
      const raw = readBrowserStorage('localStorage', `finsight_goals_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) state.goals = parsed;
      }
    } catch (e) {
      state.goals = [];
    }
  }

  function savePersistedGoals() {
    const userId = state.user?.id || 'default';
    try {
      writeBrowserStorage('localStorage', `finsight_goals_${userId}`, JSON.stringify(state.goals));
    } catch (e) {}
  }

  function initialsFromName(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function applyUserToUi() {
    const user = state.user;
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const avatarEl = document.getElementById('user-avatar');
    const greetEl = document.getElementById('overview-greeting');
    if (!user) {
      if (nameEl) nameEl.textContent = 'Signed out';
      if (emailEl) emailEl.textContent = '';
      if (avatarEl) avatarEl.textContent = '—';
      if (greetEl) greetEl.textContent = 'Your finances, grounded in your ledger.';
      return;
    }
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = initialsFromName(user.name);
    if (greetEl) {
      greetEl.textContent = `${user.name} · ${user.email} · ${user.currency} workspace`;
    }
  }

  function showApp() {
    const auth = document.getElementById('auth-screen');
    const app = document.getElementById('app-layout');
    if (auth) auth.hidden = true;
    if (app) {
      app.hidden = false;
      app.classList.remove('is-locked');
    }
    applyUserToUi();
  }

  function showAuth() {
    const auth = document.getElementById('auth-screen');
    const app = document.getElementById('app-layout');
    if (auth) auth.hidden = false;
    if (app) {
      app.hidden = true;
      app.classList.add('is-locked');
    }
    state.user = null;
    applyUserToUi();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCurrency(amountInNPR, customCurrency = state.currentCurrency) {
    const curr = state.exchangeRates[customCurrency] || state.exchangeRates.NPR;
    const converted = amountInNPR * curr.rate;
    if (curr.code === 'NPR') {
      return `${curr.symbol}${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (curr.code === 'JPY') {
      return `${curr.symbol}${Math.round(converted).toLocaleString('en-US')}`;
    }
    return `${curr.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatAssetPrice(asset) {
    if (asset.isIndex) {
      return `${asset.priceNPR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts`;
    }
    return formatCurrency(asset.priceNPR);
  }

  function formatAssetChange(asset) {
    const sign = asset.changeNPR >= 0 ? '+' : '';
    if (asset.isIndex) return `${sign}${asset.changeNPR.toFixed(2)} pts`;
    return `${sign}${formatCurrency(Math.abs(asset.changeNPR))}`;
  }

  function refreshIcons(root) {
    if (!window.lucide) return;
    if (root) lucide.createIcons({ nodes: [root].filter(Boolean) });
    else lucide.createIcons();
  }

  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type || 'info'}`;
    let icon = 'info';
    if (type === 'success') icon = 'check';
    if (type === 'warning') icon = 'alert-triangle';
    toast.innerHTML = `<i data-lucide="${icon}"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    refreshIcons(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function recalcSavings() {
    const inc = state.metrics.monthlyIncomeNPR;
    const exp = state.metrics.monthlyExpenseNPR;
    state.metrics.savingsRate = inc > 0 ? parseFloat((((inc - exp) / inc) * 100).toFixed(1)) : 0;
  }

  function setFormError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!msg) {
      el.textContent = '';
      el.classList.add('hidden');
      return;
    }
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function updateKpiCards() {
    const totalOutflow = state.expenseCategories.reduce((sum, c) => sum + c.spentNPR, 0);
    recalcSavings();

    const netWorthEl = document.getElementById('kpi-net-worth-val');
    const incomeEl = document.getElementById('kpi-income-val');
    const expenseEl = document.getElementById('kpi-expense-val');
    const savingsEl = document.getElementById('kpi-savings-val');
    const donutTotalEl = document.getElementById('donut-center-total');
    const healthBadge = document.getElementById('health-score-badge');
    const healthBar = document.getElementById('health-progress-bar');
    const healthWrap = document.getElementById('health-progress-wrap');
    const overviewOutflowBadge = document.getElementById('overview-outflow-badge');
    const budgetBadge = document.getElementById('budget-total-spend-badge');
    const budgetStatus = document.getElementById('overall-budget-status');

    if (netWorthEl) netWorthEl.textContent = formatCurrency(state.metrics.netWorthNPR);
    if (incomeEl) incomeEl.textContent = formatCurrency(state.metrics.monthlyIncomeNPR);
    if (expenseEl) expenseEl.textContent = formatCurrency(state.metrics.monthlyExpenseNPR);
    if (savingsEl) savingsEl.textContent = `${state.metrics.savingsRate}%`;
    if (donutTotalEl) donutTotalEl.textContent = formatCurrency(state.metrics.netWorthNPR);
    if (healthBadge) healthBadge.textContent = 'Live';
    if (healthBar) healthBar.style.width = '100%';
    if (healthWrap) healthWrap.setAttribute('aria-valuenow', '100');
    if (overviewOutflowBadge) overviewOutflowBadge.textContent = `Outflow ${formatCurrency(totalOutflow)}`;

    const totalCap = state.expenseCategories.reduce((s, c) => s + c.capNPR, 0);
    const usedPct = totalCap ? Math.round((totalOutflow / totalCap) * 100) : 0;
    if (budgetBadge) {
      budgetBadge.textContent = totalCap ? `${formatCurrency(totalOutflow)} / ${formatCurrency(totalCap)} (${usedPct}%)` : 'No budgets set';
    }
    if (budgetStatus) {
      budgetStatus.textContent = totalCap ? (usedPct >= 90 ? 'Tight' : 'On track') : 'No budgets';
      budgetStatus.className = `badge ${usedPct >= 90 ? 'badge-warning' : 'badge-success'}`;
    }

    renderAssetLegend();
    renderExpenseBreakdownMatrix();
  }

  function renderAssetLegend() {
    const container = document.getElementById('asset-legend-grid');
    if (!container) return;
    container.innerHTML = state.assetAllocations.map((asset) => `
      <div class="legend-item">
        <div class="legend-meta">
          <span class="legend-color-dot" style="background-color:${asset.color}"></span>
          <span class="legend-name">${escapeHtml(asset.name)}</span>
        </div>
        <span class="legend-pct">${asset.pct}%</span>
      </div>
    `).join('');
  }

  function renderExpenseBreakdownMatrix() {
    const stackedBar = document.getElementById('expense-stacked-bar');
    const matrixGrid = document.getElementById('category-matrix-grid');
    if (!stackedBar || !matrixGrid) return;

    const totalOutflow = state.expenseCategories.reduce((sum, c) => sum + c.spentNPR, 0) || 1;

    stackedBar.innerHTML = state.expenseCategories.map((cat) => {
      const pct = ((cat.spentNPR / totalOutflow) * 100).toFixed(1);
      return `<div class="stacked-segment" style="width:${pct}%;background:${cat.hexColor}" title="${escapeHtml(cat.name)} ${pct}%"></div>`;
    }).join('');

    matrixGrid.innerHTML = state.expenseCategories.map((cat) => {
      const pctOfTotal = ((cat.spentNPR / totalOutflow) * 100).toFixed(1);
      const budgetPct = cat.capNPR ? Math.min(100, Math.round((cat.spentNPR / cat.capNPR) * 100)) : 0;
      const subitemsHtml = cat.subitems.map((sub) => `
        <span class="subitem-chip">${escapeHtml(sub.name)}: <strong>${formatCurrency(sub.amountNPR)}</strong></span>
      `).join('');
      return `
        <button type="button" class="expense-cat-card" data-category="${escapeHtml(cat.name)}">
          <div class="cat-card-top">
            <div class="cat-card-title-wrap">
              <div class="cat-icon-badge ${cat.colorClass}"><i data-lucide="${cat.icon}"></i></div>
              <span class="cat-name">${escapeHtml(cat.name)}</span>
            </div>
            <span class="cat-pct-badge ${cat.colorClass}">${pctOfTotal}%</span>
          </div>
          <div class="cat-amount-row">
            <span class="cat-main-amount tabular">${formatCurrency(cat.spentNPR)}</span>
            <span class="cat-cap-limit">${cat.capNPR ? `Cap ${formatCurrency(cat.capNPR)}` : 'No budget'}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${budgetPct}%;background:${cat.hexColor}"></div>
          </div>
          <div class="cat-subitems-wrap">${subitemsHtml}</div>
        </button>
      `;
    }).join('');

    refreshIcons(matrixGrid);

    matrixGrid.querySelectorAll('.expense-cat-card').forEach((card) => {
      card.addEventListener('click', () => {
        const catName = card.dataset.category;
        document.querySelector('.sidebar-nav [data-view="transactions"]')?.click();
        const txCat = document.getElementById('tx-category-filter');
        if (txCat) {
          txCat.value = catName;
          state.txFilters.category = catName;
          state.txPagination.currentPage = 1;
          renderFullTransactionsTable();
          showToast(`Ledger filtered: ${catName}`, 'info');
        }
      });
    });
  }

  function renderMiniMarketTable() {
    const tbody = document.getElementById('mini-market-tbody');
    if (!tbody) return;
    const topAssets = state.marketAssets.slice(0, 6);
    tbody.innerHTML = topAssets.map((asset) => {
      const isPositive = asset.changePct >= 0;
      const sign = isPositive ? '+' : '';
      return `
        <tr>
          <td>
            <div class="ticker-cell">
              <span class="ticker-symbol">${escapeHtml(asset.symbol)}</span>
              ${asset.name !== asset.symbol ? `<span class="ticker-name">${escapeHtml(asset.name)}</span>` : ''}
            </div>
          </td>
          <td class="price tabular" id="ticker-price-${asset.id}">${formatAssetPrice(asset)}</td>
          <td>
            <span class="trend-badge ${isPositive ? 'positive' : 'negative'}" id="ticker-pct-${asset.id}">
              <i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}"></i> ${sign}${asset.changePct.toFixed(2)}%
            </span>
          </td>
          <td class="tabular">${Number(asset.volume || 0).toLocaleString('en-US')}</td>
        </tr>
      `;
    }).join('');
    refreshIcons(tbody);
  }

  function renderFullMarketTable() {
    const tbody = document.getElementById('full-market-tbody');
    const heroContainer = document.getElementById('market-hero-indices');
    const empty = document.getElementById('market-empty');
    if (!tbody) return;

    let filtered = state.marketAssets;
    if (state.marketCategory !== 'all') {
      filtered = filtered.filter((a) => a.category === state.marketCategory);
    }
    if (state.marketSearch.trim()) {
      const q = state.marketSearch.toLowerCase();
      filtered = filtered.filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }

    if (heroContainer) {
      const indices = state.marketAssets.filter((a) => a.isIndex);
      heroContainer.innerHTML = indices.map((idx) => {
        const isPos = idx.changePct >= 0;
        return `
          <div class="index-card">
            <span class="index-title">${escapeHtml(idx.symbol)}</span>
            <span class="index-val">${formatAssetPrice(idx)}</span>
            <span class="trend-badge ${isPos ? 'positive' : 'negative'}">
              <i data-lucide="${isPos ? 'trending-up' : 'trending-down'}"></i>
              ${isPos ? '+' : ''}${idx.changePct.toFixed(2)}% (${formatAssetChange(idx)})
            </span>
          </div>
        `;
      }).join('');
      refreshIcons(heroContainer);
    }

    if (empty) empty.classList.toggle('hidden', filtered.length > 0);

    tbody.innerHTML = filtered.map((asset) => {
      const isPositive = asset.changePct >= 0;
      const sign = isPositive ? '+' : '';
      const range = asset.isIndex
        ? `${asset.dayLow.toFixed(1)} – ${asset.dayHigh.toFixed(1)}`
        : `${formatCurrency(asset.dayLow)} – ${formatCurrency(asset.dayHigh)}`;
      return `
        <tr>
          <td>
            <div class="ticker-cell">
              <span class="ticker-symbol">${escapeHtml(asset.symbol)}</span>
              ${asset.name !== asset.symbol ? `<span class="ticker-name">${escapeHtml(asset.name)}</span>` : ''}
            </div>
          </td>
          <td class="tabular text-muted">${state.marketAssets.indexOf(asset) + 1}</td>
          <td class="price tabular font-bold" id="full-price-${asset.id}">${formatAssetPrice(asset)}</td>
          <td class="tabular ${isPositive ? 'positive' : 'negative'}">${formatAssetChange(asset)}</td>
          <td>
            <span class="trend-badge ${isPositive ? 'positive' : 'negative'}" id="full-pct-${asset.id}">
              <i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}"></i> ${sign}${asset.changePct.toFixed(2)}%
            </span>
          </td>
          <td class="tabular text-muted">${range}</td>
          <td class="tabular">${Number(asset.volume || 0).toLocaleString('en-US')}</td>
          <td>
            <button type="button" class="btn btn-sm btn-outline btn-trade" data-symbol="${escapeHtml(asset.symbol)}">Note</button>
          </td>
        </tr>
      `;
    }).join('');

    refreshIcons(tbody);
    tbody.querySelectorAll('.btn-trade').forEach((btn) => {
      btn.addEventListener('click', () => {
        showToast(`Demo only — no order sent for ${btn.dataset.symbol}`, 'info');
      });
    });
  }

  function renderRecentTransactions() {
    const tbody = document.getElementById('recent-transactions-tbody');
    if (!tbody) return;
    const recent = state.transactions.slice(0, 6);
    tbody.innerHTML = recent.length ? recent.map((tx) => {
      const isCredit = tx.type === 'credit';
      const isTransfer = tx.type === 'transfer';
      return `
        <tr>
          <td><strong>${escapeHtml(tx.desc)}</strong></td>
          <td><span class="badge badge-accent">${escapeHtml(tx.category)}</span></td>
          <td class="text-muted">${escapeHtml(tx.date)}</td>
          <td class="tabular ${isCredit ? 'text-emerald' : ''}">${isTransfer ? '↔ ' : isCredit ? '+' : '-'}${formatCurrency(tx.amountNPR)}</td>
          <td><span class="badge ${tx.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${escapeHtml(tx.status)}</span></td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5" class="text-muted">No transactions yet. Add an entry to start your ledger.</td></tr>';
  }

  function renderFullTransactionsTable() {
    const tbody = document.getElementById('full-transactions-tbody');
    const paginationContainer = document.getElementById('tx-pagination-btns');
    const countDisplay = document.getElementById('tx-count-display');
    if (!tbody) return;

    const list = state.transactions.filter((tx) => {
      if (state.txFilters.search) {
        const q = state.txFilters.search.toLowerCase();
        const match = tx.desc.toLowerCase().includes(q) || tx.account.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (state.txFilters.category !== 'all' && tx.category !== state.txFilters.category) return false;
      if (state.txFilters.type !== 'all' && tx.type !== state.txFilters.type) return false;
      if (state.txFilters.status !== 'all' && tx.status !== state.txFilters.status) return false;
      return true;
    });

    const total = list.length;
    const pageSize = state.txPagination.pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (state.txPagination.currentPage > totalPages) state.txPagination.currentPage = totalPages;
    const currentPage = state.txPagination.currentPage;
    const startIdx = (currentPage - 1) * pageSize;
    const pagedList = list.slice(startIdx, startIdx + pageSize);

    if (countDisplay) {
      const endIdx = Math.min(startIdx + pageSize, total);
      countDisplay.textContent = total > 0
        ? `${startIdx + 1}–${endIdx} of ${total}`
        : 'No entries match those filters';
    }

    tbody.innerHTML = pagedList.map((tx) => {
      const isCredit = tx.type === 'credit';
      const isTransfer = tx.type === 'transfer';
      return `
        <tr>
          <td class="tabular text-muted">${escapeHtml(tx.date)}</td>
          <td><strong>${escapeHtml(tx.desc)}</strong></td>
          <td><span class="badge badge-accent">${escapeHtml(tx.category)}</span></td>
          <td class="text-muted">${escapeHtml(tx.account)}</td>
          <td class="tabular font-bold ${isCredit ? 'text-emerald' : ''}">${isTransfer ? '↔ ' : isCredit ? '+' : '-'}${formatCurrency(tx.amountNPR)}</td>
          <td><span class="badge ${tx.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${escapeHtml(tx.status)}</span></td>
          <td>
            <button type="button" class="icon-btn-ghost btn-delete-tx" data-id="${escapeHtml(tx.id)}" aria-label="Remove entry">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (paginationContainer) {
      let btns = '';
      for (let p = 1; p <= totalPages; p += 1) {
        btns += `<button type="button" class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
      paginationContainer.innerHTML = btns;
      paginationContainer.querySelectorAll('.page-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.txPagination.currentPage = parseInt(btn.dataset.page, 10);
          renderFullTransactionsTable();
        });
      });
    }

    refreshIcons(tbody);
    tbody.querySelectorAll('.btn-delete-tx').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!window.confirm('Remove this entry from your ledger? The record will remain in the audit history.')) return;
        apiRequest(`/api/transactions/${btn.dataset.id}`, { method: 'DELETE' })
          .then(() => loadLiveLedger())
          .then(() => showToast('Entry removed and balances recalculated', 'info'))
          .catch((error) => showToast(error.message, 'warning'));
      });
    });
  }

  function renderGoalsAndBudgets() {
    const goalsOverviewContainer = document.getElementById('goals-list-container');
    if (goalsOverviewContainer) {
      goalsOverviewContainer.innerHTML = state.goals.length ? state.goals.map((goal) => {
        const pct = Math.min(100, Math.round((goal.currentNPR / goal.targetNPR) * 100));
        return `
          <div class="goal-item">
            <div class="goal-meta">
              <span class="goal-title">${escapeHtml(goal.title)}</span>
              <span class="goal-numbers">${formatCurrency(goal.currentNPR)} / ${formatCurrency(goal.targetNPR)} (${pct}%)</span>
            </div>
            <div class="progress-track"><div class="progress-fill ${goal.color}" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('') : '<p class="empty-hint">No goals saved yet.</p>';
    }

    const budgetBarsContainer = document.getElementById('budget-bars-container');
    if (budgetBarsContainer) {
      const configuredBudgets = state.expenseCategories.filter((b) => b.capNPR > 0).slice(0, 5);
      budgetBarsContainer.innerHTML = configuredBudgets.length ? configuredBudgets.map((b) => {
        const pct = Math.min(100, Math.round((b.spentNPR / b.capNPR) * 100));
        const color = pct >= 85 ? 'amber' : 'emerald';
        return `
          <div class="budget-bar-item">
            <div class="budget-bar-header">
              <span class="budget-bar-title">${escapeHtml(b.name)}</span>
              <span class="budget-bar-amt">${formatCurrency(b.spentNPR)} / ${formatCurrency(b.capNPR)} (${pct}%)</span>
            </div>
            <div class="progress-track"><div class="progress-fill ${color}" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('') : '<p class="empty-hint">No budgets are configured yet.</p>';
    }

    const detailedBudgetGrid = document.getElementById('detailed-budget-container');
    if (detailedBudgetGrid) {
      const configuredBudgets = state.expenseCategories.filter((b) => b.capNPR > 0);
      detailedBudgetGrid.innerHTML = configuredBudgets.length ? configuredBudgets.map((b) => {
        const pct = Math.min(100, Math.round((b.spentNPR / b.capNPR) * 100));
        const remaining = b.capNPR - b.spentNPR;
        return `
          <div class="detailed-budget-card">
            <div class="detailed-budget-top">
              <span class="budget-cat-name">${escapeHtml(b.name)}</span>
              <span class="badge ${pct > 85 ? 'badge-warning' : 'badge-success'}">${pct}%</span>
            </div>
            <div class="tabular font-bold" style="font-size:1.1rem">
              ${formatCurrency(b.spentNPR)}
              <span class="text-muted" style="font-size:0.8rem;font-weight:400"> / ${formatCurrency(b.capNPR)}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${b.hexColor}"></div></div>
            <span class="text-muted" style="font-size:12px">${remaining >= 0 ? formatCurrency(remaining) + ' left' : 'Over by ' + formatCurrency(Math.abs(remaining))}</span>
          </div>
        `;
      }).join('') : '<p class="empty-hint">Add a budget to compare planned spending with actual transactions.</p>';
    }

    const goalsCardGrid = document.getElementById('goals-card-grid');
    if (goalsCardGrid) {
      goalsCardGrid.innerHTML = state.goals.length ? state.goals.map((goal) => {
        const pct = Math.min(100, Math.round((goal.currentNPR / Math.max(goal.targetNPR, 1)) * 100));
        return `
          <div class="goal-card-box">
            <div class="flex-align-center" style="justify-content:space-between">
              <span class="badge badge-accent">${escapeHtml(goal.date)}</span>
              <span class="badge ${pct >= 100 ? 'badge-success' : 'badge-accent'}">${pct}%</span>
            </div>
            <h3 style="font-size:1rem;font-weight:650">${escapeHtml(goal.title)}</h3>
            <div class="tabular font-bold" style="font-size:1.2rem">
              ${formatCurrency(goal.currentNPR)}
              <span class="text-muted" style="font-size:0.8rem;font-weight:400"> / ${formatCurrency(goal.targetNPR)}</span>
            </div>
            <div class="progress-track"><div class="progress-fill ${goal.color}" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('') : '<p class="empty-hint">Create a milestone to track a savings target.</p>';
    }
  }

  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      textColor: isDark ? '#8f8578' : '#7a7166',
      gridColor: isDark ? 'rgba(244,239,230,0.06)' : 'rgba(28,25,22,0.06)',
      cardBg: isDark ? '#211c17' : '#fbf7f0',
      tooltipBg: isDark ? '#2a241d' : '#fffdf8',
      tooltipText: isDark ? '#f4efe6' : '#1c1916',
      borderColor: isDark ? '#3a342c' : '#ddd2c0'
    };
  }

  function setChartEmptyState(canvas, message) {
    if (!canvas) return;
    canvas.hidden = Boolean(message);
    let placeholder = canvas.parentElement.querySelector('.chart-empty-state');
    if (message && !placeholder) {
      placeholder = document.createElement('p');
      placeholder.className = 'chart-empty-state';
      canvas.parentElement.appendChild(placeholder);
    }
    if (placeholder) {
      if (message) placeholder.textContent = message;
      else placeholder.remove();
    }
  }

  function initPortfolioChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx || !window.Chart) return;
    if (portfolioChartInstance) portfolioChartInstance.destroy();
    const tc = getThemeColors();
    const activeData = state.timeframeData[state.activeTimeframe];
    if (!activeData.values.length) {
      portfolioChartInstance = null;
      setChartEmptyState(ctx, 'Balance history is not available yet. Current balances use your accounts and posted transactions.');
      return;
    }
    setChartEmptyState(ctx, '');
    const convertedValues = activeData.values.map((v) => v * state.exchangeRates[state.currentCurrency].rate);
    const canvasCtx = ctx.getContext('2d');
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(196, 165, 116, 0.28)');
    gradient.addColorStop(1, 'rgba(196, 165, 116, 0)');

    portfolioChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: activeData.labels,
        datasets: [{
          label: 'Mark',
          data: convertedValues,
          borderColor: PALETTE.brass,
          borderWidth: 2,
          pointBackgroundColor: PALETTE.brass,
          pointBorderColor: tc.cardBg,
          pointRadius: 2,
          pointHoverRadius: 5,
          fill: true,
          backgroundColor: gradient,
          tension: 0.25
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tc.tooltipBg,
            titleColor: tc.tooltipText,
            bodyColor: tc.tooltipText,
            borderColor: tc.borderColor,
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const sym = state.exchangeRates[state.currentCurrency].symbol;
                return `${sym}${Number(context.raw).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc.textColor, font: { family: 'IBM Plex Sans', size: 11 } } },
          y: {
            grid: { color: tc.gridColor },
            ticks: {
              color: tc.textColor,
              font: { family: 'IBM Plex Mono', size: 11 },
              callback: function (val) {
                const sym = state.exchangeRates[state.currentCurrency].symbol;
                if (state.currentCurrency === 'NPR') {
                  if (val >= 10000000) return `${sym}${(val / 10000000).toFixed(1)} Cr`;
                  if (val >= 100000) return `${sym}${(val / 100000).toFixed(0)} L`;
                }
                if (val >= 1000000) return `${sym}${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}k`;
                return `${sym}${val}`;
              }
            }
          }
        }
      }
    });
  }

  function initAssetDonutChart() {
    const ctx = document.getElementById('assetDonutChart');
    if (!ctx || !window.Chart) return;
    if (assetDonutChartInstance) assetDonutChartInstance.destroy();
    if (!state.assetAllocations.length) {
      assetDonutChartInstance = null;
      setChartEmptyState(ctx, 'Add an account balance to see your account mix.');
      return;
    }
    setChartEmptyState(ctx, '');
    const tc = getThemeColors();
    assetDonutChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: state.assetAllocations.map((a) => a.name),
        datasets: [{
          data: state.assetAllocations.map((a) => a.amountNPR * state.exchangeRates[state.currentCurrency].rate),
          backgroundColor: state.assetAllocations.map((a) => a.color),
          borderWidth: 2,
          borderColor: tc.cardBg,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tc.tooltipBg,
            titleColor: tc.tooltipText,
            bodyColor: tc.tooltipText,
            callbacks: {
              label: function (context) {
                const sym = state.exchangeRates[state.currentCurrency].symbol;
                return ` ${context.label}: ${sym}${Number(context.raw).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
              }
            }
          }
        }
      }
    });
  }

  function initAnalyticsCharts() {
    if (!window.Chart) return;
    const tc = getThemeColors();
    const cfCtx = document.getElementById('cashflowChart');
    if (cfCtx) {
      if (cashflowChartInstance) cashflowChartInstance.destroy();
      const pack = state.cashflow[state.analyticsRange] || state.cashflow.ytd;
      if (!pack.labels.length) {
        cashflowChartInstance = null;
        setChartEmptyState(cfCtx, 'Cash-flow history is not available yet. Current-month totals are shown above.');
      } else {
        setChartEmptyState(cfCtx, '');
      const curr = state.exchangeRates[state.currentCurrency].rate;
      cashflowChartInstance = new Chart(cfCtx, {
        type: 'bar',
        data: {
          labels: pack.labels,
          datasets: [
            { label: 'Inflow', data: pack.inflow.map((v) => v * curr), backgroundColor: PALETTE.forest, borderRadius: 3 },
            { label: 'Outflow', data: pack.outflow.map((v) => v * curr), backgroundColor: PALETTE.rose, borderRadius: 3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: tc.textColor, font: { family: 'IBM Plex Sans', size: 12 } } },
            tooltip: { backgroundColor: tc.tooltipBg, titleColor: tc.tooltipText, bodyColor: tc.tooltipText }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: tc.textColor } },
            y: {
              grid: { color: tc.gridColor },
              ticks: {
                color: tc.textColor,
                callback: (v) => {
                  const sym = state.exchangeRates[state.currentCurrency].symbol;
                  if (state.currentCurrency === 'NPR') return `${sym}${(v / 100000).toFixed(0)} L`;
                  return `${sym}${(v / 1000).toFixed(0)}k`;
                }
              }
            }
          }
        }
      });
      }
    }

    const expCatCtx = document.getElementById('expenseCategoryChart');
    if (expCatCtx) {
      if (expenseCatChartInstance) expenseCatChartInstance.destroy();
      if (!state.expenseCategories.length) {
        expenseCatChartInstance = null;
        setChartEmptyState(expCatCtx, 'No posted expenses in this month yet.');
      } else {
        setChartEmptyState(expCatCtx, '');
      expenseCatChartInstance = new Chart(expCatCtx, {
        type: 'doughnut',
        data: {
          labels: state.expenseCategories.map((c) => c.name),
          datasets: [{
            data: state.expenseCategories.map((c) => c.spentNPR * state.exchangeRates[state.currentCurrency].rate),
            backgroundColor: state.expenseCategories.map((c) => c.hexColor),
            borderColor: tc.cardBg,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: tc.textColor, font: { size: 10 }, boxWidth: 10 } },
            tooltip: {
              backgroundColor: tc.tooltipBg,
              titleColor: tc.tooltipText,
              bodyColor: tc.tooltipText
            }
          }
        }
      });
      }
    }

    const projCtx = document.getElementById('projectionChart');
    if (projCtx) {
      if (projectionChartInstance) projectionChartInstance.destroy();
      projectionChartInstance = null;
      setChartEmptyState(projCtx, 'No scenario estimate is available yet.');
    }
  }

  function refreshAllCharts() {
    initPortfolioChart();
    initAssetDonutChart();
    if (state.currentView === 'analytics') initAnalyticsCharts();
  }

  function applyTick(asset) {
    const tickSizes = [0.2, 0.5, 1, 1.5, 2, 3];
    let deltaNPR;
    if (asset.isIndex) {
      const deltaPct = Math.random() * 0.4 - 0.18;
      deltaNPR = asset.priceNPR * (deltaPct / 100);
    } else {
      const chosenTick = tickSizes[Math.floor(Math.random() * tickSizes.length)];
      let direction = Math.random() > 0.44 ? 1 : -1;
      if (asset.changePct > 9.5 && direction > 0) direction = -1;
      if (asset.changePct < -9.5 && direction < 0) direction = 1;
      deltaNPR = chosenTick * direction;
    }

    asset.priceNPR = Math.max(asset.isIndex ? 50 : 10, asset.priceNPR + deltaNPR);
    asset.changeNPR += deltaNPR;
    const open = asset.priceNPR - asset.changeNPR;
    asset.changePct = open ? (asset.changeNPR / open) * 100 : 0;
    if (asset.priceNPR < asset.dayLow) asset.dayLow = asset.priceNPR;
    if (asset.priceNPR > asset.dayHigh) asset.dayHigh = asset.priceNPR;
    asset.history.push(asset.priceNPR);
    if (asset.history.length > 12) asset.history.shift();
    return deltaNPR;
  }

  function patchTickerCell(asset, deltaNPR) {
    const miniPrice = document.getElementById(`ticker-price-${asset.id}`);
    const miniPct = document.getElementById(`ticker-pct-${asset.id}`);
    const fullPrice = document.getElementById(`full-price-${asset.id}`);
    const fullPct = document.getElementById(`full-pct-${asset.id}`);
    const isPos = asset.changePct >= 0;
    const sign = isPos ? '+' : '';
    const flash = deltaNPR >= 0 ? 'price-flash-green' : 'price-flash-red';

    if (miniPrice) {
      miniPrice.textContent = formatAssetPrice(asset);
      miniPrice.className = `price tabular ${flash}`;
      setTimeout(() => { miniPrice.className = 'price tabular'; }, 650);
    }
    if (miniPct) {
      miniPct.className = `trend-badge ${isPos ? 'positive' : 'negative'}`;
      miniPct.innerHTML = `<i data-lucide="${isPos ? 'trending-up' : 'trending-down'}"></i> ${sign}${asset.changePct.toFixed(2)}%`;
      refreshIcons(miniPct);
    }
    if (fullPrice) {
      fullPrice.textContent = formatAssetPrice(asset);
      fullPrice.className = `price tabular font-bold ${flash}`;
      setTimeout(() => { fullPrice.className = 'price tabular font-bold'; }, 650);
    }
    if (fullPct) {
      fullPct.className = `trend-badge ${isPos ? 'positive' : 'negative'}`;
      fullPct.innerHTML = `<i data-lucide="${isPos ? 'trending-up' : 'trending-down'}"></i> ${sign}${asset.changePct.toFixed(2)}%`;
      refreshIcons(fullPct);
    }
  }

  function startLiveMarketFeed() {
    if (marketTickTimer) clearInterval(marketTickTimer);
    marketTickTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      loadMarketData().catch(() => {});
    }, 30000);
  }

  function stopLiveMarketFeed() {
    if (marketTickTimer) {
      clearInterval(marketTickTimer);
      marketTickTimer = null;
    }
  }

  function exportTransactionsToCSV() {
    const headers = ['id', 'date', 'description', 'category', 'account', 'amount_npr', 'type', 'status'];
    const lines = [headers.join(',')];
    // CSV quoting protects delimiters; neutralizing a leading formula marker
    // also prevents spreadsheet applications from evaluating user supplied text.
    function csvCell(value) {
      let text = String(value ?? '');
      if (/^[\u0000-\u0020]*[=+@-]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    }
    state.transactions.forEach((t) => {
      const cells = [
        t.id, t.date, t.desc, t.category, t.account, t.amountNPR.toFixed(2), t.type, t.status
      ].map(csvCell);
      lines.push(cells.join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finsight-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('CSV downloaded', 'success');
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    const first = modal.querySelector('input, select, button');
    if (first) first.focus();
  }

  function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
  }

  function setupAuthListeners() {
    const initialRegistering = new URLSearchParams(window.location.search).get('mode') === 'register';
    let registering = initialRegistering;
    const nameGroup = document.getElementById('auth-name-group');
    const nameInput = document.getElementById('auth-name');
    const passwordInput = document.getElementById('auth-password');
    const heading = document.getElementById('auth-heading');
    const lead = document.getElementById('auth-lead');
    const submit = document.getElementById('auth-submit');
    const modeToggle = document.getElementById('auth-mode-toggle');

    function applyAuthMode(nextRegistering) {
      registering = nextRegistering;
      nameGroup?.classList.toggle('hidden', !registering);
      if (nameInput) nameInput.required = registering;
      if (passwordInput) passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
      if (heading) heading.textContent = registering ? 'Create your workspace' : 'Sign in to your workspace';
      if (lead) lead.textContent = registering ? 'Start with an empty, private ledger. You can add accounts and transactions next.' : 'Your financial records are stored in your own account.';
      if (submit) submit.textContent = registering ? 'Create account' : 'Sign in';
      if (modeToggle) modeToggle.textContent = registering ? 'Already have an account? Sign in' : 'Create a new account';
      setFormError('auth-error', '');
    }

    applyAuthMode(registering);

    modeToggle?.addEventListener('click', () => {
      applyAuthMode(!registering);
    });
    document.getElementById('auth-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFormError('auth-error', '');
      const payload = {
        email: document.getElementById('auth-email').value.trim(),
        password: passwordInput.value
      };
      if (registering) payload.name = nameInput.value.trim();
      submit.disabled = true;
      try {
        const session = await apiRequest(registering ? '/api/auth/register' : '/api/auth/login', {
          method: 'POST', body: JSON.stringify(payload)
        });
        state.apiToken = session.access_token;
        state.user = session.user;
        await enterApp();
      } catch (error) {
        setFormError('auth-error', error.message || 'Unable to sign in. Check your details and try again.');
      } finally {
        submit.disabled = false;
      }
    });
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
      stopLiveMarketFeed();
      apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
      state.apiToken = '';
      showAuth();
    });
  }

  async function enterApp() {
    try {
      showApp();
      await loadLiveLedger();
      await loadMarketData();
      refreshIcons();
      animateKpiCards();
      renderMiniMarketTable();
      renderFullMarketTable();
      startLiveMarketFeed();
      whenChartReady(() => {
        initPortfolioChart();
        initAssetDonutChart();
      });
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = setInterval(() => {
        if (document.visibilityState === 'visible') loadLiveLedger().catch(() => {
          const syncStatus = document.getElementById('sync-status');
          if (syncStatus) syncStatus.textContent = 'Connection interrupted. Retrying shortly.';
        });
      }, 10000);
    } catch (error) {
      showAuth();
      setFormError('auth-error', error.message || 'Unable to load your ledger. Please sign in again.');
    }
  }

  function setupEventListeners() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-view]');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const targetView = item.dataset.view;
        if (targetView === 'transfer-modal-trigger') {
          openModal('transfer-modal');
          return;
        }
        if (targetView === 'reports') {
          exportTransactionsToCSV();
          return;
        }
        navItems.forEach((n) => {
          if (n.dataset.view !== 'transfer-modal-trigger' && n.dataset.view !== 'reports') {
            n.classList.remove('active');
          }
        });
        item.classList.add('active');
        document.querySelectorAll('.view-panel').forEach((panel) => panel.classList.remove('active'));
        const activePanel = document.getElementById(`view-${targetView}`);
        if (activePanel) {
          activePanel.classList.add('active');
          state.currentView = targetView;
          if (targetView === 'analytics') initAnalyticsCharts();
          if (targetView === 'markets') renderFullMarketTable();
          if (targetView === 'transactions') renderFullTransactionsTable();
          if (targetView === 'accounts') renderAccounts();
          if (targetView === 'budgets') {
            renderGoalsAndBudgets();
            updateKpiCards();
          }
        }
        document.getElementById('sidebar')?.classList.remove('open');
      });
    });

    document.getElementById('btn-view-all-markets')?.addEventListener('click', () => {
      document.querySelector('.sidebar-nav [data-view="markets"]')?.click();
    });
    document.getElementById('btn-view-all-transactions')?.addEventListener('click', () => {
      document.querySelector('.sidebar-nav [data-view="transactions"]')?.click();
    });

    document.querySelectorAll('#timeframe-selector .time-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#timeframe-selector .time-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTimeframe = btn.dataset.time;
        initPortfolioChart();
      });
    });

    document.querySelectorAll('#analytics-range .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#analytics-range .btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.analyticsRange = btn.dataset.range;
        initAnalyticsCharts();
      });
    });

    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
      currencySelect.value = state.currentCurrency;
      currencySelect.addEventListener('change', (e) => {
        state.currentCurrency = e.target.value;
        updateKpiCards();
        renderMiniMarketTable();
        renderRecentTransactions();
        renderFullTransactionsTable();
        renderFullMarketTable();
        renderGoalsAndBudgets();
        refreshAllCharts();
        showToast(`Showing ${state.currentCurrency}`, 'info');
      });
    }

    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('theme-icon-moon');
    const sunIcon = document.getElementById('theme-icon-sun');

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      state.currentTheme = theme;
      writeBrowserStorage('localStorage', 'self_finance_theme', theme);
      if (theme === 'light') {
        moonIcon?.classList.add('hidden');
        sunIcon?.classList.remove('hidden');
      } else {
        sunIcon?.classList.add('hidden');
        moonIcon?.classList.remove('hidden');
      }
      refreshAllCharts();
    }

    setTheme(readBrowserStorage('localStorage', 'self_finance_theme', 'dark'));
    themeToggleBtn?.addEventListener('click', () => {
      setTheme(state.currentTheme === 'dark' ? 'light' : 'dark');
    });

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    notifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = notifDropdown?.classList.toggle('show');
      notifBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.notif-wrapper')) {
        notifDropdown?.classList.remove('show');
        notifBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    document.getElementById('btn-open-add-modal')?.addEventListener('click', () => openModal('add-tx-modal'));
    document.getElementById('btn-add-transaction-ledger')?.addEventListener('click', () => openModal('add-tx-modal'));
    document.getElementById('btn-close-tx-modal')?.addEventListener('click', () => closeModal('add-tx-modal'));
    document.getElementById('btn-cancel-tx-modal')?.addEventListener('click', () => closeModal('add-tx-modal'));
    document.getElementById('btn-add-account')?.addEventListener('click', () => openModal('add-account-modal'));
    document.getElementById('btn-close-account-modal')?.addEventListener('click', () => closeModal('add-account-modal'));
    document.getElementById('btn-cancel-account-modal')?.addEventListener('click', () => closeModal('add-account-modal'));
    document.getElementById('btn-quick-transfer')?.addEventListener('click', () => openModal('transfer-modal'));
    document.getElementById('btn-close-transfer-modal')?.addEventListener('click', () => closeModal('transfer-modal'));
    document.getElementById('btn-cancel-transfer-modal')?.addEventListener('click', () => closeModal('transfer-modal'));
    document.getElementById('btn-add-goal')?.addEventListener('click', () => openModal('goal-modal'));
    document.getElementById('btn-open-create-goal')?.addEventListener('click', () => openModal('goal-modal'));
    document.getElementById('btn-close-goal-modal')?.addEventListener('click', () => closeModal('goal-modal'));
    document.getElementById('btn-cancel-goal-modal')?.addEventListener('click', () => closeModal('goal-modal'));

    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });

    document.getElementById('add-tx-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      setFormError('tx-form-error', '');
      const desc = document.getElementById('tx-desc').value.trim();
      const amount = document.getElementById('tx-amount').value;
      const uiType = document.getElementById('tx-type').value;
      const categoryId = Number(document.getElementById('tx-category').value);
      const accountId = Number(document.getElementById('tx-account').value);
      const date = document.getElementById('tx-date').value || new Date().toISOString().slice(0, 10);
      const status = document.getElementById('tx-status').value;
      const category = state.categories.find((item) => item.id === categoryId);

      if (!desc) return setFormError('tx-form-error', 'Add a description.');
      if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(amount) || Number(amount) <= 0) {
        return setFormError('tx-form-error', 'Enter an amount greater than zero with no more than two decimal places.');
      }
      if (uiType === 'credit' && category?.type !== 'income') {
        return setFormError('tx-form-error', 'Credits belong on the Income book.');
      }
      if (uiType === 'debit' && category?.type !== 'expense') {
        return setFormError('tx-form-error', 'Debits cannot use the Income book.');
      }
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          account_id: accountId,
          category_id: categoryId,
          type: uiType === 'credit' ? 'income' : 'expense',
          amount,
          currency: state.accounts.find((account) => account.id === accountId)?.currency || 'NPR',
          description: desc,
          merchant: desc,
          transaction_date: date,
          status: status === 'Completed' ? 'posted' : 'pending'
        })
      }).then(async () => {
        await loadLiveLedger();
        closeModal('add-tx-modal');
        e.target.reset();
        document.getElementById('tx-date').value = new Date().toISOString().slice(0, 10);
        showToast('Entry saved to your ledger', 'success');
      }).catch((error) => setFormError('tx-form-error', error.message));
    });

    document.getElementById('add-account-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      setFormError('account-form-error', '');
      const openingBalance = document.getElementById('account-opening-balance').value;
      if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(openingBalance)) {
        return setFormError('account-form-error', 'Enter a valid opening balance with no more than two decimal places.');
      }
      apiRequest('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('account-name').value.trim(),
          account_type: document.getElementById('account-type').value,
          institution: document.getElementById('account-institution').value.trim() || null,
          opening_balance: openingBalance,
          currency: 'NPR'
        })
      }).then(async () => {
        await loadLiveLedger();
        closeModal('add-account-modal');
        e.target.reset();
        document.getElementById('account-opening-balance').value = '0.00';
        showToast('Account added', 'success');
      }).catch((error) => setFormError('account-form-error', error.message));
    });

    document.getElementById('transfer-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      setFormError('transfer-form-error', '');
      const from = Number(document.getElementById('transfer-from').value);
      const to = Number(document.getElementById('transfer-to').value);
      const amount = document.getElementById('transfer-amount').value;
      const note = document.getElementById('transfer-note').value.trim() || 'Internal move';
      if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(amount) || Number(amount) <= 0) {
        return setFormError('transfer-form-error', 'Enter an amount greater than zero with no more than two decimal places.');
      }
      if (from === to) {
        return setFormError('transfer-form-error', 'Pick two different accounts.');
      }
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          account_id: from, destination_account_id: to, type: 'transfer', amount,
          currency: state.accounts.find((account) => account.id === from)?.currency || 'NPR',
          description: note, transaction_date: new Date().toISOString().slice(0, 10)
        })
      }).then(async () => {
        await loadLiveLedger();
        closeModal('transfer-modal');
        e.target.reset();
        showToast('Transfer recorded without changing total balance', 'success');
      }).catch((error) => setFormError('transfer-form-error', error.message));
    });

    document.getElementById('goal-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      setFormError('goal-form-error', '');
      const title = document.getElementById('goal-name').value.trim();
      const targetNPR = parseFloat(document.getElementById('goal-target').value);
      const currentNPR = parseFloat(document.getElementById('goal-current').value);
      const date = document.getElementById('goal-target-date').value;
      if (!title) return setFormError('goal-form-error', 'Give the milestone a name.');
      if (!Number.isFinite(targetNPR) || targetNPR <= 0) {
        return setFormError('goal-form-error', 'Target must be greater than zero.');
      }
      if (!Number.isFinite(currentNPR) || currentNPR < 0) {
        return setFormError('goal-form-error', 'Saved amount cannot be negative.');
      }
      if (currentNPR > targetNPR) {
        return setFormError('goal-form-error', 'Saved amount cannot exceed the target.');
      }
      state.goals.push({ id: `g-${Date.now()}`, title, targetNPR, currentNPR, date, color: 'emerald' });
      savePersistedGoals();
      renderGoalsAndBudgets();
      closeModal('goal-modal');
      e.target.reset();
      showToast('Milestone saved', 'success');
    });

    document.getElementById('tx-type')?.addEventListener('change', () => {
      updateTxCategoryOptions();
    });

    const txSearch = document.getElementById('tx-search-input');
    const txCat = document.getElementById('tx-category-filter');
    const txType = document.getElementById('tx-type-filter');
    const txStatus = document.getElementById('tx-status-filter');

    function applyTxFilters() {
      state.txFilters.search = txSearch?.value || '';
      state.txFilters.category = txCat?.value || 'all';
      state.txFilters.type = txType?.value || 'all';
      state.txFilters.status = txStatus?.value || 'all';
      state.txPagination.currentPage = 1;
      renderFullTransactionsTable();
    }

    txSearch?.addEventListener('input', applyTxFilters);
    txCat?.addEventListener('change', applyTxFilters);
    txType?.addEventListener('change', applyTxFilters);
    txStatus?.addEventListener('change', applyTxFilters);
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      if (txSearch) txSearch.value = '';
      if (txCat) txCat.value = 'all';
      if (txType) txType.value = 'all';
      if (txStatus) txStatus.value = 'all';
      applyTxFilters();
    });

    let searchTimer;
    document.getElementById('global-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        if (!q) return;
        const looksLikeTicker = state.marketAssets.some(
          (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
        );
        if (looksLikeTicker) {
          document.querySelector('.sidebar-nav [data-view="markets"]')?.click();
          const marketSearchInput = document.getElementById('market-search');
          if (marketSearchInput) {
            marketSearchInput.value = q;
            state.marketSearch = q;
            renderFullMarketTable();
          }
        } else {
          document.querySelector('.sidebar-nav [data-view="transactions"]')?.click();
          if (txSearch) {
            txSearch.value = q;
            applyTxFilters();
          }
        }
      }, 280);
    });

    document.getElementById('market-search')?.addEventListener('input', (e) => {
      state.marketSearch = e.target.value;
      renderFullMarketTable();
    });

    document.querySelectorAll('#market-category-filters .filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#market-category-filters .filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        state.marketCategory = pill.dataset.cat;
        renderFullMarketTable();
      });
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', exportTransactionsToCSV);
    document.getElementById('btn-export-transactions-csv')?.addEventListener('click', exportTransactionsToCSV);

    const dateEl = document.getElementById('current-date-display');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }
    const today = new Date().toISOString().slice(0, 10);
    const txDateInput = document.getElementById('tx-date');
    if (txDateInput) txDateInput.value = today;
    const goalDate = document.getElementById('goal-target-date');
    if (goalDate && !goalDate.value) goalDate.min = today;
  }

  function whenChartReady(fn, tries) {
    if (window.Chart) {
      fn();
      return;
    }
    if ((tries || 0) > 40) return;
    setTimeout(() => whenChartReady(fn, (tries || 0) + 1), 50);
  }

  /* ═══════════════════════════════════════════════
     ANIMATED FINANCE BACKGROUND CANVAS
     ═══════════════════════════════════════════════ */

  function initFinanceBackground() {
    const canvas = document.getElementById('finance-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w, h, particles, gridLines, mouseX, mouseY;
    const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticles() {
      const count = Math.min(50, Math.floor((w * h) / 25000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.2,
          r: Math.random() * 1.8 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
          color: Math.random() > 0.6
            ? 'rgba(39, 214, 155,'
            : Math.random() > 0.5
              ? 'rgba(228, 185, 105,'
              : 'rgba(73, 185, 232,'
        });
      }
    }

    function createGridLines() {
      gridLines = [];
      const spacing = 60;
      for (let x = 0; x < w; x += spacing) {
        gridLines.push({ x1: x, y1: 0, x2: x, y2: h, horizontal: false });
      }
      for (let y = 0; y < h; y += spacing) {
        gridLines.push({ x1: 0, y1: y, x2: w, y2: y, horizontal: true });
      }
    }

    function drawGrid(time) {
      if (!isDark()) return;
      const alpha = 0.03 + Math.sin(time * 0.0005) * 0.01;
      ctx.strokeStyle = `rgba(117, 242, 194, ${alpha})`;
      ctx.lineWidth = 0.5;
      gridLines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      });
    }

    function drawRadialGlow(time) {
      if (!isDark()) return;
      const cx = w * 0.75 + Math.sin(time * 0.0003) * 80;
      const cy = h * 0.15 + Math.cos(time * 0.0004) * 40;
      const r = 300 + Math.sin(time * 0.0006) * 60;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(39, 214, 155, 0.06)');
      grad.addColorStop(0.5, 'rgba(39, 214, 155, 0.02)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const cx2 = w * 0.2 + Math.cos(time * 0.0004) * 60;
      const cy2 = h * 0.8 + Math.sin(time * 0.0003) * 50;
      const r2 = 250 + Math.cos(time * 0.0005) * 50;
      const grad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r2);
      grad2.addColorStop(0, 'rgba(73, 185, 232, 0.04)');
      grad2.addColorStop(0.6, 'rgba(73, 185, 232, 0.01)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);
    }

    function drawParticles(time) {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const pulse = Math.sin(time * 0.001 + p.x * 0.01) * 0.15;
        const alpha = p.alpha + pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.max(0.05, alpha) + ')';
        ctx.fill();
      });

      const connectionDist = 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(117, 242, 194, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate(time) {
      ctx.clearRect(0, 0, w, h);
      drawGrid(time);
      drawRadialGlow(time);
      drawParticles(time);
      requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    createGridLines();
    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      resize();
      createParticles();
      createGridLines();
    });
  }

  /* ═══════════════════════════════════════════════
     SMOOTH KPI COUNTER ANIMATION
     ═══════════════════════════════════════════════ */

  function animateValue(el, start, end, duration, formatter) {
    if (!el) return;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      el.textContent = formatter(current);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  let kpiAnimated = false;

  function animateKpiCards() {
    if (kpiAnimated) {
      updateKpiCards();
      return;
    }
    kpiAnimated = true;
    const netWorthEl = document.getElementById('kpi-net-worth-val');
    const incomeEl = document.getElementById('kpi-income-val');
    const expenseEl = document.getElementById('kpi-expense-val');
    const savingsEl = document.getElementById('kpi-savings-val');

    if (netWorthEl) {
      animateValue(netWorthEl, 0, state.metrics.netWorthNPR, 1200, (v) => formatCurrency(v));
    }
    if (incomeEl) {
      animateValue(incomeEl, 0, state.metrics.monthlyIncomeNPR, 1000, (v) => formatCurrency(v));
    }
    if (expenseEl) {
      animateValue(expenseEl, 0, state.metrics.monthlyExpenseNPR, 1000, (v) => formatCurrency(v));
    }
    if (savingsEl) {
      animateValue(savingsEl, 0, state.metrics.savingsRate, 800, (v) => `${v.toFixed(1)}%`);
    }
  }

  function init() {
    removeLegacyLocalAuthData();
    clearDemoState();
    setupAuthListeners();
    setupEventListeners();
    refreshIcons();
    initFinanceBackground();
    state.apiToken = '';
    apiRequest('/api/auth/session').then((session) => {
      if (!session?.authenticated) {
        state.user = null;
        state.apiToken = '';
        showAuth();
        return;
      }
      state.user = session.user;
      state.apiToken = '';
      return enterApp();
    }).catch(() => {
      state.user = null;
      state.apiToken = '';
      showAuth();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
