/**
 * Self Finance — household ledger & NEPSE watch (demo ticks)
 */
(function () {
  'use strict';

  const PALETTE = {
    brass: '#c4a574',
    forest: '#3d8b65',
    ink: '#7a9bb8',
    amber: '#c9893a',
    plum: '#8b6bb0',
    rose: '#d4533e',
    teal: '#6a9e8b',
    blush: '#c47a94'
  };

  const state = {
    user: { name: 'Demo user', email: '' },
    currentView: 'overview',
    currentCurrency: 'NPR',
    currentTheme: 'dark',
    activeTimeframe: '1Y',
    analyticsRange: 'ytd',
    exchangeRates: {
      NPR: { rate: 1.0, symbol: 'Rs ', code: 'NPR' },
      USD: { rate: 0.00746, symbol: '$', code: 'USD' },
      EUR: { rate: 0.00685, symbol: '€', code: 'EUR' },
      GBP: { rate: 0.00585, symbol: '£', code: 'GBP' },
      JPY: { rate: 1.15, symbol: '¥', code: 'JPY' },
      CAD: { rate: 0.0101, symbol: 'C$', code: 'CAD' }
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
    marketAssets: [
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
    ],
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

  function removeLegacyLocalAuthData() {
    try {
      localStorage.removeItem('self_finance_users');
      localStorage.removeItem('self_finance_session');
    } catch (e) {
      // Storage can be unavailable in private or restricted browser contexts.
    }
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
      if (greetEl) greetEl.textContent = 'Demo preview — no account is used.';
      return;
    }
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = initialsFromName(user.name);
    if (greetEl) {
      greetEl.textContent = `${user.name} — Shrawan close, NEPSE sleeve, and the household books.`;
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
      .replace(/"/g, '&quot;');
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
    state.metrics.monthlyExpenseNPR = totalOutflow;
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
    if (healthBadge) healthBadge.textContent = `${state.metrics.healthScore} / 100`;
    if (healthBar) healthBar.style.width = `${state.metrics.healthScore}%`;
    if (healthWrap) healthWrap.setAttribute('aria-valuenow', String(state.metrics.healthScore));
    if (overviewOutflowBadge) overviewOutflowBadge.textContent = `Outflow ${formatCurrency(totalOutflow)}`;

    const totalCap = state.expenseCategories.reduce((s, c) => s + c.capNPR, 0);
    const usedPct = totalCap ? Math.round((totalOutflow / totalCap) * 100) : 0;
    if (budgetBadge) {
      budgetBadge.textContent = `${formatCurrency(totalOutflow)} / ${formatCurrency(totalCap)} (${usedPct}%)`;
    }
    if (budgetStatus) {
      budgetStatus.textContent = usedPct >= 90 ? 'Tight' : 'On track';
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
      const budgetPct = Math.min(100, Math.round((cat.spentNPR / cat.capNPR) * 100));
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
            <span class="cat-cap-limit">Cap ${formatCurrency(cat.capNPR)}</span>
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

  function sparklineHtml(asset) {
    return `<canvas class="sparkline-canvas" width="80" height="24" data-history='${JSON.stringify(asset.history)}' data-positive="${asset.changePct >= 0}"></canvas>`;
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
              <span class="ticker-name">${escapeHtml(asset.name)}</span>
            </div>
          </td>
          <td class="price tabular" id="ticker-price-${asset.id}">${formatAssetPrice(asset)}</td>
          <td>
            <span class="trend-badge ${isPositive ? 'positive' : 'negative'}" id="ticker-pct-${asset.id}">
              <i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}"></i> ${sign}${asset.changePct.toFixed(2)}%
            </span>
          </td>
          <td>${sparklineHtml(asset)}</td>
        </tr>
      `;
    }).join('');
    drawSparklines();
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
              <span class="ticker-name">${escapeHtml(asset.name)}</span>
            </div>
          </td>
          <td><span class="badge badge-accent">${escapeHtml(asset.category)}</span></td>
          <td class="price tabular font-bold" id="full-price-${asset.id}">${formatAssetPrice(asset)}</td>
          <td class="tabular ${isPositive ? 'positive' : 'negative'}">${formatAssetChange(asset)}</td>
          <td>
            <span class="trend-badge ${isPositive ? 'positive' : 'negative'}" id="full-pct-${asset.id}">
              <i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}"></i> ${sign}${asset.changePct.toFixed(2)}%
            </span>
          </td>
          <td class="tabular text-muted">${range}</td>
          <td class="tabular">${escapeHtml(asset.cap)}</td>
          <td>${sparklineHtml(asset)}</td>
          <td>
            <button type="button" class="btn btn-sm btn-outline btn-trade" data-symbol="${escapeHtml(asset.symbol)}">Note</button>
          </td>
        </tr>
      `;
    }).join('');

    drawSparklines();
    refreshIcons(tbody);
    tbody.querySelectorAll('.btn-trade').forEach((btn) => {
      btn.addEventListener('click', () => {
        showToast(`Demo only — no order sent for ${btn.dataset.symbol}`, 'info');
      });
    });
  }

  function drawSparklines() {
    document.querySelectorAll('.sparkline-canvas').forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let data = [];
      try { data = JSON.parse(canvas.dataset.history || '[]'); } catch (e) { data = []; }
      const isPos = canvas.dataset.positive === 'true';
      if (data.length < 2) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      const min = Math.min.apply(null, data);
      const max = Math.max.apply(null, data);
      const range = max - min || 1;
      ctx.beginPath();
      ctx.strokeStyle = isPos ? PALETTE.forest : PALETTE.rose;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * (width - 4) + 2;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }

  function renderRecentTransactions() {
    const tbody = document.getElementById('recent-transactions-tbody');
    if (!tbody) return;
    const recent = state.transactions.slice(0, 6);
    tbody.innerHTML = recent.map((tx) => {
      const isCredit = tx.type === 'credit';
      return `
        <tr>
          <td><strong>${escapeHtml(tx.desc)}</strong></td>
          <td><span class="badge badge-accent">${escapeHtml(tx.category)}</span></td>
          <td class="text-muted">${escapeHtml(tx.date)}</td>
          <td class="tabular ${isCredit ? 'text-emerald' : ''}">${isCredit ? '+' : '-'}${formatCurrency(tx.amountNPR)}</td>
          <td><span class="badge ${tx.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${escapeHtml(tx.status)}</span></td>
        </tr>
      `;
    }).join('');
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
      return `
        <tr>
          <td class="tabular text-muted">${escapeHtml(tx.date)}</td>
          <td><strong>${escapeHtml(tx.desc)}</strong></td>
          <td><span class="badge badge-accent">${escapeHtml(tx.category)}</span></td>
          <td class="text-muted">${escapeHtml(tx.account)}</td>
          <td class="tabular font-bold ${isCredit ? 'text-emerald' : ''}">${isCredit ? '+' : '-'}${formatCurrency(tx.amountNPR)}</td>
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
        if (!window.confirm('Remove this entry from the demo ledger?')) return;
        const id = btn.dataset.id;
        state.transactions = state.transactions.filter((t) => t.id !== id);
        showToast('Entry removed', 'info');
        renderRecentTransactions();
        renderFullTransactionsTable();
      });
    });
  }

  function renderGoalsAndBudgets() {
    const goalsOverviewContainer = document.getElementById('goals-list-container');
    if (goalsOverviewContainer) {
      goalsOverviewContainer.innerHTML = state.goals.map((goal) => {
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
      }).join('');
    }

    const budgetBarsContainer = document.getElementById('budget-bars-container');
    if (budgetBarsContainer) {
      budgetBarsContainer.innerHTML = state.expenseCategories.slice(0, 5).map((b) => {
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
      }).join('');
    }

    const detailedBudgetGrid = document.getElementById('detailed-budget-container');
    if (detailedBudgetGrid) {
      detailedBudgetGrid.innerHTML = state.expenseCategories.map((b) => {
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
      }).join('');
    }

    const goalsCardGrid = document.getElementById('goals-card-grid');
    if (goalsCardGrid) {
      goalsCardGrid.innerHTML = state.goals.map((goal) => {
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
      }).join('');
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

  function initPortfolioChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx || !window.Chart) return;
    if (portfolioChartInstance) portfolioChartInstance.destroy();
    const tc = getThemeColors();
    const activeData = state.timeframeData[state.activeTimeframe];
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

    const expCatCtx = document.getElementById('expenseCategoryChart');
    if (expCatCtx) {
      if (expenseCatChartInstance) expenseCatChartInstance.destroy();
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

    const projCtx = document.getElementById('projectionChart');
    if (projCtx) {
      if (projectionChartInstance) projectionChartInstance.destroy();
      const years = ['2083', '2084', '2085', '2086', '2087', '2088'];
      const conservative = [16.8, 19.1, 21.8, 24.9, 28.5, 32.8];
      const optimistic = [16.8, 20.8, 26.0, 32.8, 41.5, 52.8];
      const curr = state.exchangeRates[state.currentCurrency].rate;
      projectionChartInstance = new Chart(projCtx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            { label: '13.5% CAGR', data: conservative.map((v) => v * 10000000 * curr), borderColor: PALETTE.ink, borderDash: [5, 5], tension: 0.25, fill: false },
            { label: '24% CAGR', data: optimistic.map((v) => v * 10000000 * curr), borderColor: PALETTE.forest, tension: 0.25, fill: false }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: tc.textColor } },
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
                  if (state.currentCurrency === 'NPR') return `${sym}${(v / 10000000).toFixed(1)} Cr`;
                  return `${sym}${(v / 1000000).toFixed(1)}M`;
                }
              }
            }
          }
        }
      });
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
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i += 1) {
        const asset = state.marketAssets[Math.floor(Math.random() * state.marketAssets.length)];
        const delta = applyTick(asset);
        patchTickerCell(asset, delta);
      }
      drawSparklines();
    }, 1800);
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
    link.download = `self-finance-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
    document.getElementById('enter-demo')?.addEventListener('click', () => {
      state.user = { name: 'Demo user', email: '' };
      enterApp();
    });
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
      showAuth();
      showToast('Signed out', 'info');
    });
  }

  function enterApp() {
    showApp();
    updateKpiCards();
    renderMiniMarketTable();
    renderRecentTransactions();
    renderFullTransactionsTable();
    renderGoalsAndBudgets();
    refreshIcons();
    startLiveMarketFeed();
    animateKpiCards();
    whenChartReady(() => {
      initPortfolioChart();
      initAssetDonutChart();
    });
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
      localStorage.setItem('self_finance_theme', theme);
      if (theme === 'light') {
        moonIcon?.classList.add('hidden');
        sunIcon?.classList.remove('hidden');
      } else {
        sunIcon?.classList.add('hidden');
        moonIcon?.classList.remove('hidden');
      }
      refreshAllCharts();
    }

    setTheme(localStorage.getItem('self_finance_theme') || 'dark');
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
      const amountNPR = parseFloat(document.getElementById('tx-amount').value);
      const type = document.getElementById('tx-type').value;
      const category = document.getElementById('tx-category').value;
      const account = document.getElementById('tx-account').value;
      const date = document.getElementById('tx-date').value || new Date().toISOString().slice(0, 10);
      const status = document.getElementById('tx-status').value;

      if (!desc) return setFormError('tx-form-error', 'Add a description.');
      if (!Number.isFinite(amountNPR) || amountNPR <= 0) {
        return setFormError('tx-form-error', 'Amount must be a number greater than zero.');
      }
      if (type === 'credit' && category !== 'Income') {
        return setFormError('tx-form-error', 'Credits belong on the Income book.');
      }
      if (type === 'debit' && category === 'Income') {
        return setFormError('tx-form-error', 'Debits cannot use the Income book.');
      }

      state.transactions.unshift({
        id: `tx-${Date.now()}`,
        date, desc, category, account, amountNPR, type, status
      });

      if (type === 'credit') {
        state.metrics.monthlyIncomeNPR += amountNPR;
        state.metrics.netWorthNPR += amountNPR;
      } else {
        state.metrics.netWorthNPR -= amountNPR;
        const matchCat = state.expenseCategories.find((c) => c.name === category);
        if (matchCat) {
          matchCat.spentNPR += amountNPR;
          matchCat.subitems.unshift({ name: desc.slice(0, 28), amountNPR });
        }
      }

      updateKpiCards();
      renderRecentTransactions();
      renderFullTransactionsTable();
      renderGoalsAndBudgets();
      refreshAllCharts();
      closeModal('add-tx-modal');
      e.target.reset();
      const today = new Date().toISOString().slice(0, 10);
      const txDateInput = document.getElementById('tx-date');
      if (txDateInput) txDateInput.value = today;
      showToast('Entry posted', 'success');
    });

    document.getElementById('transfer-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      setFormError('transfer-form-error', '');
      const from = document.getElementById('transfer-from').value;
      const to = document.getElementById('transfer-to').value;
      const amountNPR = parseFloat(document.getElementById('transfer-amount').value);
      const note = document.getElementById('transfer-note').value.trim() || 'Internal move';
      if (!Number.isFinite(amountNPR) || amountNPR < 1000) {
        return setFormError('transfer-form-error', 'Minimum transfer is Rs 1,000.');
      }
      if (from === to) {
        return setFormError('transfer-form-error', 'Pick two different accounts.');
      }
      state.transactions.unshift({
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        desc: `Transfer to ${to} — ${note}`,
        category: 'Transfer',
        account: from,
        amountNPR,
        type: 'debit',
        status: 'Completed'
      });
      renderRecentTransactions();
      renderFullTransactionsTable();
      closeModal('transfer-modal');
      e.target.reset();
      showToast(`Moved ${formatCurrency(amountNPR)}`, 'success');
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
      renderGoalsAndBudgets();
      closeModal('goal-modal');
      e.target.reset();
      showToast('Milestone saved', 'success');
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
    setupAuthListeners();
    setupEventListeners();
    refreshIcons();
    initFinanceBackground();
    showAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
