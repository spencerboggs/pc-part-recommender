const fs = require('fs');
const path = require('path');
const { fetchPrices } = require('../desktop/prices');

const OUT = path.join(__dirname, '..', 'site', 'assets', 'prices.js');

async function main() {
  const data = await fetchPrices();
  const output = `window.PCPriceData = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(OUT, output);
  console.log('Wrote ' + Object.keys(data.prices).length + ' prices to ' + OUT);
  console.log('RTX 5080: ' + data.prices['rtx-5080']);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
