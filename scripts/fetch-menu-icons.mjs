// Downloads a transparent 3D PNG icon per menu item into assets/icons/.
// Source: Microsoft Fluent UI Emoji (MIT license) https://github.com/microsoft/fluentui-emoji
// Usage: node scripts/fetch-menu-icons.mjs [--force]
// To use your own artwork for an item, replace assets/icons/<slug>.png with any PNG.
import { createRequire } from 'node:module';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { MENU } = require('../menu-data.js');

const OUT = path.resolve('assets', 'icons');
const BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/';
const FORCE = process.argv.includes('--force');

// Item slug -> Fluent emoji name
const ICON = {
  'tea': 'Teacup without handle', 'lemon-tea': 'Lemon', 'black-tea': 'Teacup without handle',
  'masala-tea': 'Teacup without handle', 'ginger-tea': 'Ginger root', 'cardamom-tea': 'Teacup without handle',
  'filter-coffee': 'Hot beverage', 'black-coffee': 'Hot beverage', 'boost': 'Glass of milk', 'horlicks': 'Glass of milk',
  'watermelon-iced-tea': 'Ice', 'cold-coffee': 'Bubble tea', 'milo': 'Bubble tea',
  'badam-milk': 'Glass of milk', 'rose-milk': 'Rose', 'lemon-juice': 'Lemon', 'nannari-sarbath': 'Herb',
  'lime-water': 'Lemon', 'lassi': 'Glass of milk', 'sweet-lemon-soda': 'Lemon', 'musk-melon-juice': 'Melon',
  'watermelon-juice': 'Watermelon', 'grape-juice': 'Grapes', 'fig-juice': 'Cup with straw', 'dates-juice': 'Cup with straw',
  'red-banana-juice': 'Banana', 'saathukudi-juice': 'Tangerine', 'pineapple-juice': 'Pineapple', 'apple-juice': 'Red apple',
  'dragon-fruit-juice': 'Tropical drink', 'avocado-juice': 'Avocado', 'strawberry-juice': 'Strawberry',
  'kiwi-juice': 'Kiwi fruit', 'orange-juice': 'Tangerine', 'pomegranate-juice': 'Cherries', 'fig-dates-juice': 'Beverage box',
  'mint-mojito': 'Tropical drink', 'strawberry-mojito': 'Strawberry', 'watermelon-mojito': 'Watermelon',
  'blueberry-mojito': 'Blueberries', 'blue-curacao-mojito': 'Tropical drink',
  'vanilla-milkshake': 'Soft ice cream', 'strawberry-milkshake': 'Ice cream', 'chocolate-milkshake': 'Chocolate bar',
  'butterscotch-milkshake': 'Honey pot', 'oreo-milkshake': 'Cookie',
  'bread-omelette': 'Cooking', 'onion-rings': 'Onion', 'veg-puffs': 'Croissant', 'veg-roll': 'Burrito',
  'mushroom-puffs': 'Mushroom', 'egg-puffs': 'Egg', 'chicken-puffs': 'Croissant', 'chicken-roll': 'Burrito',
  'french-fries': 'French fries', 'peri-peri-fries': 'Hot pepper', 'masala-fries': 'French fries',
  'cheesy-fries': 'Cheese wedge', 'chicken-loaded-fries': 'French fries',
  'veg-wrap': 'Burrito', 'mushroom-wrap': 'Burrito', 'paneer-wrap': 'Stuffed flatbread', 'chicken-wrap': 'Stuffed flatbread',
  'grilled-veg-sandwich': 'Sandwich', 'mushroom-sandwich': 'Sandwich', 'paneer-sandwich': 'Sandwich',
  'grilled-chicken-sandwich': 'Sandwich', 'chicken-popcorn': 'Popcorn', 'chicken-wings': 'Poultry leg',
  'chicken-leg': 'Poultry leg', 'paneer-popcorn': 'Cheese wedge', 'cheese-stuffed-mushroom': 'Mushroom',
  'veg-burger': 'Hamburger', 'mushroom-burger': 'Hamburger', 'paneer-burger': 'Hamburger',
  'fried-egg-burger': 'Hamburger', 'fried-chicken-burger': 'Hamburger'
};

const exists = (p) => access(p).then(() => true, () => false);
const urlFor = (name) => BASE + encodeURIComponent(name) + '/3D/' + name.toLowerCase().replace(/ /g, '_') + '_3d.png';

async function main() {
  await mkdir(OUT, { recursive: true });
  const cache = new Map(); // same icon reused by several items
  const failed = [];

  for (const item of MENU) {
    const slug = path.basename(item.img, '.png');
    const file = path.join(OUT, slug + '.png');
    const name = ICON[slug];
    if (!name) { failed.push(item.name + ' (no mapping)'); continue; }
    if (!FORCE && (await exists(file))) continue;
    try {
      if (!cache.has(name)) {
        const res = await fetch(urlFor(name));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        cache.set(name, Buffer.from(await res.arrayBuffer()));
      }
      await writeFile(file, cache.get(name));
      console.log('  saved', slug + '.png', '<-', name);
    } catch (e) {
      failed.push(item.name + ' (' + name + ': ' + e.message + ')');
    }
  }
  console.log(failed.length ? '\nFailed: ' + failed.join(', ') : '\nAll icons saved.');
}

main().catch((e) => { console.error(e); process.exit(1); });
