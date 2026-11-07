const SOURCE = 'Newegg via ComponentPrices';
const SOURCE_URL = 'https://componentprices.com/';
const BASE = 'https://componentprices.com/catalog/rows/';
const REQUEST_TIMEOUT = 20000;

const gpuMap = {
  'rtx-5090': ['/gpu/geforce-rtx-5090', 32],
  'rtx-5080': ['/gpu/geforce-rtx-5080', 16],
  'rtx-5070-ti': ['/gpu/geforce-rtx-5070-ti', 16],
  'rtx-5070': ['/gpu/geforce-rtx-5070', 12],
  'rtx-5060-ti-16': ['/gpu/geforce-rtx-5060-ti-16gb', 16],
  'rtx-5060-ti': ['/gpu/geforce-rtx-5060-ti-8gb', 8],
  'rtx-5060': ['/gpu/geforce-rtx-5060', 8],
  'rtx-4060': ['/gpu/geforce-rtx-4060', 8],
  'rx-9070-xt': ['/gpu/radeon-rx-9070-xt', 16],
  'rx-9070': ['/gpu/radeon-rx-9070', 16],
  'rx-9070-gre': ['/gpu/radeon-rx-9070-gre', 12],
  'rx-9060-xt-16': ['/gpu/radeon-rx-9060-xt-16gb', 16]
};

const manualGpu = {
  'rtx-5050': 419.99,
  'rx-9060-xt': 499.99,
  'rx-9060': 399.99,
  'arc-b580': 329.99,
  'arc-b570': 289.99
};

const cpuMap = {
  'r9-9950x3d2': '/cpu/ryzen-9-9950x3d2-dual-edition',
  'r9-9950x3d': '/cpu/ryzen-9-9950x3d',
  'r9-9950x': '/cpu/ryzen-9-9950x',
  'r9-9900x3d': '/cpu/ryzen-9-9900x3d',
  'r9-9900x': '/cpu/ryzen-9-9900x',
  'r7-9800x3d': '/cpu/ryzen-7-9800x3d',
  'r7-9700x': '/cpu/ryzen-7-9700x',
  'r5-9600x': '/cpu/ryzen-5-9600x',
  'r7-7800x3d': '/cpu/ryzen-7-7800x3d',
  'r7-7700x': '/cpu/ryzen-7-7700x',
  'r7-7700': '/cpu/ryzen-7-7700',
  'r5-7600x': '/cpu/ryzen-5-7600x',
  'r5-7600': '/cpu/ryzen-5-7600',
  'r9-7950x3d': '/cpu/ryzen-9-7950x3d',
  'r9-7950x': '/cpu/ryzen-9-7950x',
  'r9-7900x': '/cpu/ryzen-9-7900x',
  'r7-5800x3d': '/cpu/ryzen-7-5800x3d',
  'r7-5700x3d': '/cpu/ryzen-7-5700x3d',
  'r7-5800x': '/cpu/ryzen-7-5800x',
  'r7-5700x': '/cpu/ryzen-7-5700x',
  'r5-5600x': '/cpu/ryzen-5-5600x',
  'r5-5600': '/cpu/ryzen-5-5600',
  'r9-5950x': '/cpu/ryzen-9-5950x',
  'u9-285k': '/cpu/core-ultra-9-285k',
  'u7-265k': '/cpu/core-ultra-7-265k',
  'u7-265kf': '/cpu/core-ultra-7-265kf',
  'u5-250k-plus': '/cpu/core-ultra-5-250k-plus',
  'u5-245k': '/cpu/core-ultra-5-245k',
  'u5-225f': '/cpu/core-ultra-5-225f',
  'i9-14900k': '/cpu/core-i9-14900k',
  'i7-14700k': '/cpu/core-i7-14700k',
  'i5-14600k': '/cpu/core-i5-14600k',
  'i5-14400f': '/cpu/core-i5-14400f',
  'i5-13400f': '/cpu/core-i5-13400f',
  'i5-12600k': '/cpu/core-i5-12600k',
  'i5-12400f': '/cpu/core-i5-12400f',
  'i7-12700k': '/cpu/core-i7-12700k',
  'i9-12900k': '/cpu/core-i9-12900k'
};

const ramMap = {
  'ddr5-32-6000-cl30': [32, 'DDR5', 6000, 2, 30],
  'ddr5-32-5600-cl36': [32, 'DDR5', 5600, 2, 36],
  'ddr5-32-6400-cl32': [32, 'DDR5', 6400, 2, 32],
  'ddr5-16-6000-cl30': [16, 'DDR5', 6000, 2, 30],
  'ddr5-64-6000-cl30': [64, 'DDR5', 6000, 2, 30],
  'ddr5-64-5600-cl36': [64, 'DDR5', 5600, 2, 36],
  'ddr4-16-3200-cl16': [16, 'DDR4', 3200, 2, 16],
  'ddr4-32-3200-cl16': [32, 'DDR4', 3200, 2, 16],
  'ddr4-32-3600-cl18': [32, 'DDR4', 3600, 2, 18],
  'ddr4-64-3200-cl16': [64, 'DDR4', 3200, 2, 16],
  'ddr4-64-3600-cl18': [64, 'DDR4', 3600, 2, 18]
};

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function pacificDate(value) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value || new Date());
  const part = (type) => parts.find((item) => item.type === type).value;
  return part('year') + '-' + part('month') + '-' + part('day');
}

async function fetchRows(category) {
  const response = await fetch(BASE + category + '.json', {
    headers: { 'user-agent': 'PCUpgradeAdvisor/1.0 price refresh' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT)
  });
  if (!response.ok) throw new Error(category + ': HTTP ' + response.status);
  const json = await response.json();
  const fields = Object.fromEntries(json.fields.map((name, index) => [name, index]));
  return {
    fields,
    rows: json.rows.filter((row) => row[fields.stock] === 'in-stock' && row[fields.condition] === 'new')
  };
}

function lowestGpu(rows, fields, slug, capacity) {
  const prices = rows
    .filter((row) => row[fields.product] === slug && Number(row[fields.cap]) === Number(capacity) && Number(row[fields.price]) > 0)
    .map((row) => Number(row[fields.price]));
  return prices.length ? money(Math.min(...prices)) : null;
}

function lowestCpu(rows, fields, slug) {
  const prices = rows
    .filter((row) => row[fields.product] === slug && Number(row[fields.price]) > 0)
    .map((row) => Number(row[fields.price]));
  return prices.length ? money(Math.min(...prices)) : null;
}

function lowestRam(rows, fields, spec) {
  const [capacity, generation, speed, modules, latency] = spec;
  const candidates = rows.filter((row) =>
    Number(row[fields.cap]) === Number(capacity) &&
    String(row[fields.gen]) === generation &&
    Number(row[fields.speed]) === Number(speed) &&
    Number(row[fields.mods]) === Number(modules) &&
    Number(row[fields.price]) > 0
  );
  if (!candidates.length) return null;
  const exact = candidates.filter((row) => Number(row[fields.cl]) === Number(latency));
  const pool = exact.length ? exact : candidates;
  return money(Math.min(...pool.map((row) => Number(row[fields.price]))));
}

async function fetchPrices() {
  const [gpu, cpu, ram] = await Promise.all([
    fetchRows('gpu'),
    fetchRows('cpu'),
    fetchRows('ram')
  ]);

  const prices = {};
  for (const [id, [slug, capacity]] of Object.entries(gpuMap)) {
    const price = lowestGpu(gpu.rows, gpu.fields, slug, capacity);
    if (price) prices[id] = price;
  }
  Object.assign(prices, manualGpu);

  for (const [id, slug] of Object.entries(cpuMap)) {
    const price = lowestCpu(cpu.rows, cpu.fields, slug);
    if (price) prices[id] = price;
  }

  for (const [id, spec] of Object.entries(ramMap)) {
    const price = lowestRam(ram.rows, ram.fields, spec);
    if (price) prices[id] = price;
  }

  return {
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    checked: pacificDate(),
    prices
  };
}

module.exports = { fetchPrices, pacificDate };
