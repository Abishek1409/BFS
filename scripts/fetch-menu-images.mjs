// Downloads one photo per menu item from Wikimedia Commons into assets/.
// Records source and license for each file in assets/credits.json (needed for CC BY / CC BY-SA attribution).
// Usage: node scripts/fetch-menu-images.mjs [--force]
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { MENU } = require('../menu-data.js');

const ASSETS = path.resolve('assets');
const UA = 'BFS-menu-images/1.0 (local build script)';
const FORCE = process.argv.includes('--force');

// Search terms tuned per item; falls back to the item name.
const QUERY = {
  'tea': 'masala chai cup', 'lemon-tea': 'lemon tea glass', 'black-tea': 'black tea cup',
  'masala-tea': 'masala chai', 'ginger-tea': 'ginger tea', 'cardamom-tea': 'cardamom tea',
  'filter-coffee': 'south indian filter coffee', 'black-coffee': 'black coffee cup',
  'boost': 'malted milk drink', 'horlicks': 'horlicks drink', 'watermelon-iced-tea': 'iced tea glass',
  'cold-coffee': 'iced coffee glass', 'milo': 'milo drink', 'badam-milk': 'badam milk',
  'rose-milk': 'rose milk', 'nannari-sarbath': 'nannari sarbath', 'lime-water': 'lime water glass',
  'lassi': 'lassi', 'sweet-lemon-soda': 'lemon soda', 'musk-melon-juice': 'muskmelon juice',
  'fig-juice': 'fig smoothie', 'dates-juice': 'dates milkshake', 'red-banana-juice': 'banana juice',
  'saathukudi-juice': 'sweet lime juice', 'dragon-fruit-juice': 'dragon fruit juice',
  'fig-dates-juice': 'dates smoothie', 'mint-mojito': 'mojito', 'strawberry-mojito': 'strawberry mojito',
  'watermelon-mojito': 'watermelon mojito', 'blueberry-mojito': 'blueberry drink',
  'blue-curacao-mojito': 'blue curacao drink', 'bread-omelette': 'bread omelette',
  'veg-puffs': 'vegetable puff pastry', 'veg-roll': 'vegetable roll indian', 'mushroom-puffs': 'puff pastry',
  'egg-puffs': 'egg puff', 'chicken-puffs': 'chicken puff pastry', 'chicken-roll': 'chicken kathi roll',
  'peri-peri-fries': 'peri peri fries', 'masala-fries': 'masala fries', 'cheesy-fries': 'cheese fries',
  'chicken-loaded-fries': 'loaded fries', 'veg-wrap': 'vegetable wrap', 'mushroom-wrap': 'wrap sandwich',
  'paneer-wrap': 'paneer wrap', 'chicken-wrap': 'chicken wrap', 'grilled-veg-sandwich': 'grilled vegetable sandwich',
  'mushroom-sandwich': 'mushroom sandwich', 'paneer-sandwich': 'paneer sandwich',
  'grilled-chicken-sandwich': 'grilled chicken sandwich', 'chicken-popcorn': 'popcorn chicken',
  'chicken-wings': 'fried chicken wings', 'chicken-leg': 'fried chicken drumstick', 'paneer-popcorn': 'paneer pakora',
  'cheese-stuffed-mushroom': 'stuffed mushrooms', 'veg-burger': 'veggie burger', 'mushroom-burger': 'mushroom burger',
  'paneer-burger': 'paneer burger', 'fried-egg-burger': 'egg burger', 'fried-chicken-burger': 'fried chicken sandwich burger'
};

const ALLOWED = /^(CC0|Public domain|CC BY(-SA)? [0-9.]+)/i;
const strip = (s) => String(s || '').replace(/<[^>]*>/g, '').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true, () => false);

// Retries on HTTP 429 using Retry-After (or exponential backoff).
async function politeFetch(url) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status !== 429 || attempt >= 5) return res;
    const wait = (Number(res.headers.get('retry-after')) || 2 ** attempt * 5) * 1000;
    console.log('  rate limited, waiting', wait / 1000, 's');
    await sleep(wait);
  }
}

async function search(query) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '10',
    gsrsearch: 'filetype:bitmap ' + query, prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '400'
  });
  const res = await politeFetch(url);
  if (!res.ok) throw new Error('search HTTP ' + res.status);
  const pages = Object.values((await res.json()).query?.pages || {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const meta = ii?.extmetadata || {};
    const license = strip(meta.LicenseShortName?.value);
    if (!ii?.thumburl || ii.mime !== 'image/jpeg' || !ALLOWED.test(license)) continue;
    return { title: p.title, url: ii.thumburl, page: ii.descriptionurl, license, author: strip(meta.Artist?.value) };
  }
  return null;
}

async function main() {
  await mkdir(ASSETS, { recursive: true });
  const creditsPath = path.join(ASSETS, 'credits.json');
  const credits = (await exists(creditsPath)) ? JSON.parse(await readFile(creditsPath, 'utf8')) : {};
  const missing = [];

  for (const item of MENU) {
    const file = path.join(ASSETS, path.basename(item.img));
    const slug = path.basename(item.img, '.jpg');
    if (!FORCE && (await exists(file))) continue;
    try {
      const hit = (await search(QUERY[slug] || item.name)) || (await search(item.name));
      if (!hit) { missing.push(item.name); console.log('  none  ', item.name); continue; }
      const img = await politeFetch(hit.url);
      if (!img.ok) throw new Error('image HTTP ' + img.status);
      await writeFile(file, Buffer.from(await img.arrayBuffer()));
      credits[path.basename(file)] = { item: item.name, source: hit.page, license: hit.license, author: hit.author };
      console.log('  saved ', path.basename(file), '-', hit.license);
    } catch (e) {
      missing.push(item.name);
      console.log('  error ', item.name, '-', e.message);
    }
    await sleep(1500); // be polite to the Wikimedia API
  }

  await writeFile(creditsPath, JSON.stringify(credits, null, 2) + '\n');
  console.log(missing.length ? '\nNo photo for: ' + missing.join(', ') + ' (emoji will be shown)' : '\nAll photos saved.');
}

main().catch((e) => { console.error(e); process.exit(1); });
