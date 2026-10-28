// Shared BFS menu (seed for Inventory in index.html, and the customer menu in order.html).
// Browser: window.BFS_MENU, window.BFS_CAT_ICONS  |  Node: module.exports = { MENU, CAT_ICONS }
(function (root) {
  'use strict';

  var IS = ['ice', 'sugar']; // cold drinks
  var S = ['sugar'];         // hot drinks
  var N = [];                // food

  // [id, name, emoji, price, category, specs, icon slug -> assets/icons/<slug>.png]
  var ROWS = [
    // HOT
    [1,  'Tea',                     '🍵', 15,  'Hot', S, 'tea'],
    [2,  'Lemon Tea',               '🍋', 15,  'Hot', S, 'lemon-tea'],
    [3,  'Black Tea',               '🍵', 10,  'Hot', S, 'black-tea'],
    [4,  'Masala Tea',              '🍵', 20,  'Hot', S, 'masala-tea'],
    [5,  'Ginger Tea',              '🫚', 20,  'Hot', S, 'ginger-tea'],
    [6,  'Cardamom Tea',            '🍵', 20,  'Hot', S, 'cardamom-tea'],
    [7,  'Filter Coffee',           '☕', 20,  'Hot', S, 'filter-coffee'],
    [8,  'Black Coffee',            '☕', 15,  'Hot', S, 'black-coffee'],
    [9,  'Boost',                   '🥛', 20,  'Hot', S, 'boost'],
    [10, 'Horlicks',                '🥛', 20,  'Hot', S, 'horlicks'],
    // COLD
    [11, 'Watermelon Iced Tea',     '🍉', 50,  'Cold', IS, 'watermelon-iced-tea'],
    [12, 'Cold Coffee',             '🧋', 90,  'Cold', IS, 'cold-coffee'],
    [13, 'Milo',                    '🥤', 90,  'Cold', IS, 'milo'],
    // FRESH JUICES
    [14, 'Badam Milk',              '🥛', 30,  'Fresh Juices', IS, 'badam-milk'],
    [15, 'Rose Milk',               '🌸', 30,  'Fresh Juices', IS, 'rose-milk'],
    [16, 'Lemon Juice',             '🍋', 30,  'Fresh Juices', IS, 'lemon-juice'],
    [17, 'Nannari Sarbath',         '🌿', 30,  'Fresh Juices', IS, 'nannari-sarbath'],
    [18, 'Lime Water',              '🍋', 30,  'Fresh Juices', IS, 'lime-water'],
    [19, 'Lassi',                   '🥛', 30,  'Fresh Juices', IS, 'lassi'],
    [20, 'Sweet Lemon Soda',        '🍋', 40,  'Fresh Juices', IS, 'sweet-lemon-soda'],
    [21, 'Musk Melon Juice',        '🍈', 40,  'Fresh Juices', IS, 'musk-melon-juice'],
    [22, 'Watermelon Juice',        '🍉', 40,  'Fresh Juices', IS, 'watermelon-juice'],
    [23, 'Grape Juice',             '🍇', 60,  'Fresh Juices', IS, 'grape-juice'],
    [24, 'Fig Juice',               '🟣', 60,  'Fresh Juices', IS, 'fig-juice'],
    [25, 'Dates Juice',             '🟤', 60,  'Fresh Juices', IS, 'dates-juice'],
    [26, 'Red Banana Juice',        '🍌', 60,  'Fresh Juices', IS, 'red-banana-juice'],
    [27, 'Saathukudi Juice',        '🍊', 60,  'Fresh Juices', IS, 'saathukudi-juice'],
    [28, 'Pineapple Juice',         '🍍', 70,  'Fresh Juices', IS, 'pineapple-juice'],
    [29, 'Apple Juice',             '🍎', 70,  'Fresh Juices', IS, 'apple-juice'],
    [30, 'Dragon Fruit Juice',      '🐉', 70,  'Fresh Juices', IS, 'dragon-fruit-juice'],
    [31, 'Avocado Juice',           '🥑', 80,  'Fresh Juices', IS, 'avocado-juice'],
    [32, 'Strawberry Juice',        '🍓', 80,  'Fresh Juices', IS, 'strawberry-juice'],
    [33, 'Kiwi Juice',              '🥝', 80,  'Fresh Juices', IS, 'kiwi-juice'],
    [34, 'Orange Juice',            '🍊', 80,  'Fresh Juices', IS, 'orange-juice'],
    [35, 'Pomegranate Juice',       '❤️', 80,  'Fresh Juices', IS, 'pomegranate-juice'],
    [36, 'Fig + Dates Juice',       '🟤', 80,  'Fresh Juices', IS, 'fig-dates-juice'],
    // MOJITO
    [37, 'Mint Mojito',             '🌿', 70,  'Mojito', IS, 'mint-mojito'],
    [38, 'Strawberry Mojito',       '🍓', 70,  'Mojito', IS, 'strawberry-mojito'],
    [39, 'Watermelon Mojito',       '🍉', 70,  'Mojito', IS, 'watermelon-mojito'],
    [40, 'Blueberry Mojito',        '🫐', 70,  'Mojito', IS, 'blueberry-mojito'],
    [41, 'Blue Curacao Mojito',     '💙', 70,  'Mojito', IS, 'blue-curacao-mojito'],
    // MILK SHAKES
    [42, 'Vanilla Milkshake',       '🍦', 70,  'Milk Shakes', IS, 'vanilla-milkshake'],
    [43, 'Strawberry Milkshake',    '🍓', 80,  'Milk Shakes', IS, 'strawberry-milkshake'],
    [44, 'Chocolate Milkshake',     '🍫', 90,  'Milk Shakes', IS, 'chocolate-milkshake'],
    [45, 'Butterscotch Milkshake',  '🍯', 90,  'Milk Shakes', IS, 'butterscotch-milkshake'],
    [46, 'Oreo Milkshake',          '🍪', 110, 'Milk Shakes', IS, 'oreo-milkshake'],
    // QUICK BITES
    [47, 'Bread Omelette',          '🍳', 50,  'Quick Bites', N, 'bread-omelette'],
    [48, 'Onion Rings',             '🧅', 50,  'Quick Bites', N, 'onion-rings'],
    [49, 'Veg Puffs',               '🥐', 25,  'Quick Bites', N, 'veg-puffs'],
    [50, 'Veg Roll',                '🌯', 25,  'Quick Bites', N, 'veg-roll'],
    [51, 'Mushroom Puffs',          '🍄', 30,  'Quick Bites', N, 'mushroom-puffs'],
    [52, 'Egg Puffs',               '🥚', 25,  'Quick Bites', N, 'egg-puffs'],
    [53, 'Chicken Puffs',           '🍗', 30,  'Quick Bites', N, 'chicken-puffs'],
    [54, 'Chicken Roll',            '🌯', 30,  'Quick Bites', N, 'chicken-roll'],
    // FRIES
    [55, 'French Fries',            '🍟', 60,  'Fries', N, 'french-fries'],
    [56, 'Peri Peri Fries',         '🌶️', 70,  'Fries', N, 'peri-peri-fries'],
    [57, 'Masala Fries',            '🍟', 70,  'Fries', N, 'masala-fries'],
    [58, 'Cheesy Fries',            '🧀', 100, 'Fries', N, 'cheesy-fries'],
    [59, 'Chicken Loaded Fries',    '🍗', 140, 'Fries', N, 'chicken-loaded-fries'],
    // WRAPS
    [60, 'Veg Wrap',                '🌯', 80,  'Wraps', N, 'veg-wrap'],
    [61, 'Mushroom Wrap',           '🍄', 90,  'Wraps', N, 'mushroom-wrap'],
    [62, 'Paneer Wrap',             '🧀', 100, 'Wraps', N, 'paneer-wrap'],
    [63, 'Chicken Wrap',            '🌯', 100, 'Wraps', N, 'chicken-wrap'],
    // SANDWICH
    [64, 'Grilled Veg Sandwich',    '🥪', 60,  'Sandwich', N, 'grilled-veg-sandwich'],
    [65, 'Mushroom Sandwich',       '🍄', 80,  'Sandwich', N, 'mushroom-sandwich'],
    [66, 'Paneer Sandwich',         '🧀', 100, 'Sandwich', N, 'paneer-sandwich'],
    [67, 'Grilled Chicken Sandwich','🥪', 100, 'Sandwich', N, 'grilled-chicken-sandwich'],
    // FRIED SNACKS
    [68, 'Chicken Popcorn',         '🍗', 120, 'Fried Snacks', N, 'chicken-popcorn'],
    [69, 'Chicken Wings (4 pcs)',   '🍗', 150, 'Fried Snacks', N, 'chicken-wings'],
    [70, 'Chicken Leg (1 pc)',      '🍗', 90,  'Fried Snacks', N, 'chicken-leg'],
    [71, 'Paneer Popcorn',          '🧀', 110, 'Fried Snacks', N, 'paneer-popcorn'],
    [72, 'Cheese Stuffed Mushroom', '🍄', 90,  'Fried Snacks', N, 'cheese-stuffed-mushroom'],
    // BURGERS
    [73, 'Veg Burger',              '🍔', 80,  'Burgers', N, 'veg-burger'],
    [74, 'Mushroom Burger',         '🍔', 100, 'Burgers', N, 'mushroom-burger'],
    [75, 'Paneer Burger',           '🍔', 120, 'Burgers', N, 'paneer-burger'],
    [76, 'Fried Egg Burger',        '🍔', 100, 'Burgers', N, 'fried-egg-burger'],
    [77, 'Fried Chicken Burger',    '🍔', 120, 'Burgers', N, 'fried-chicken-burger']
  ];

  // Item slug -> exact file name in assets/ (case-sensitive on Vercel).
  // Slugs not listed use '<slug>.jpg'. Items with no file show their emoji.
  var PHOTO_FILE = {
    // git stores this file as lowercase tea.jpg; Vercel is case-sensitive.
    'tea': 'tea.jpg',
    'cardamom-tea': 'tea.jpg', // shares the Tea photo
    'black-tea': 'Black tea.jpeg',
    'black-coffee': 'black cofee.jpeg',
    'boost': 'boost.jpeg',
    'horlicks': 'Horlicks.jpeg',
    'cold-coffee': 'cold coffee.jpg',
    'milo': 'Cold milo.jpg',
    'musk-melon-juice': 'Muskmelon.jpeg',
    'blue-curacao-mojito': 'blue-curacao-mojito.avif',
    'blueberry-mojito': 'blueberry-mojito.webp',
    'veg-roll': 'veg roll.jpeg',
    'chicken-loaded-fries': 'chicken loaded fries.jpeg',
    'chicken-popcorn': 'Chicken popcorn.jpeg',
    'veg-burger': 'Veg burger.jpeg',
    'lemon-juice': 'lemon juice.jpg',
    'lime-water': 'lime water.jpg',
    'strawberry-mojito': 'Strawberry mojito.jpeg'
  };

  function imgFor(slug) {
    return 'assets/' + (PHOTO_FILE[slug] || slug + '.jpg');
  }

  var MENU = ROWS.map(function (r) {
    return { id: r[0], name: r[1], emoji: r[2], price: r[3], cat: r[4], specs: r[5].slice(), img: imgFor(r[6]) };
  });

  var CAT_ICONS = {
    'All': '🍽️', 'Hot': '☕', 'Cold': '🧊', 'Fresh Juices': '🍹', 'Mojito': '🌿', 'Milk Shakes': '🥤',
    'Quick Bites': '🥐', 'Fries': '🍟', 'Wraps': '🌯', 'Sandwich': '🥪', 'Fried Snacks': '🍗', 'Burgers': '🍔'
  };

  /**
   * Menu display order: categories keep the order they first appear in, and items
   * inside each category go from lowest to highest price. Equal prices keep their
   * existing order. Used by both the billing page and the QR page, so newly added
   * items land in their price position automatically.
   */
  function sortMenu(items) {
    var catRank = {};
    (items || []).forEach(function (it) {
      if (!(it.cat in catRank)) catRank[it.cat] = Object.keys(catRank).length;
    });
    return (items || []).map(function (it, i) { return { it: it, i: i }; })
      .sort(function (a, b) {
        return (catRank[a.it.cat] - catRank[b.it.cat]) ||
          ((Number(a.it.price) || 0) - (Number(b.it.price) || 0)) ||
          (a.i - b.i);
      })
      .map(function (x) { return x.it; });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { MENU: MENU, CAT_ICONS: CAT_ICONS, sortMenu: sortMenu };
  if (root) { root.BFS_MENU = MENU; root.BFS_CAT_ICONS = CAT_ICONS; root.BFS_sortMenu = sortMenu; }
})(typeof window !== 'undefined' ? window : null);
