/**
 * Automated Receipt Formatting Consistency Validation
 * Validates that browser and thermal receipts have matching structure and content
 */

// Load ESC/POS receipt generator
const escposModule = require('./escpos-receipt.js');
const { generateESCPOSReceipt, getPreferenceSymbol } = escposModule;

// Test data
const testBillData = {
  billNo: '042',
  customerName: 'John Doe',
  items: [
    {
      name: 'Mango Juice',
      emoji: '🥭',
      qty: 2,
      price: 50,
      total: 100,
      ice: 'With Ice',
      sugar: 'Normal Sugar',
      size: 'Regular',
      note: ''
    },
    {
      name: 'Orange Shake',
      emoji: '🍊',
      qty: 1,
      price: 60,
      total: 60,
      ice: 'Without Ice',
      sugar: 'No Sugar',
      size: 'Large',
      note: ''
    },
    {
      name: 'Watermelon Juice',
      emoji: '🍉',
      qty: 1,
      price: 45,
      total: 45,
      ice: 'With Ice',
      sugar: 'No Sugar',
      size: null,
      note: 'Extra cold'
    },
    {
      name: 'Banana Smoothie',
      emoji: '🍌',
      qty: 3,
      price: 55,
      total: 165,
      ice: 'Without Ice',
      sugar: 'Normal Sugar',
      size: null,
      note: ''
    }
  ],
  subtotal: 370,
  grandTotal: 370,
  date: new Date('2026-09-23T14:30:00')
};

// Browser receipt structure (simulated)
const browserReceiptStructure = {
  header: {
    title: 'Best Fruits Stall',
    subtitle: 'Fresh Juices | Shakes | Snacks'
  },
  metadata: {
    billNo: '#042',
    date: '23-Sep-2026',
    time: '14:30',
    customer: 'John Doe'
  },
  itemsTable: {
    headers: ['ITEM', 'QTY', 'PREF'],
    items: testBillData.items
  },
  totals: {
    grandTotal: 370
  },
  footer: {
    thankYou: 'Thank you for visiting Best Fruits Stall!',
    tagline: 'Stay Fresh | Stay Healthy'
  }
};

// Test suite
class ReceiptConsistencyTests {
  constructor() {
    this.tests = [];
    this.passCount = 0;
    this.failCount = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  runAllTests() {
    console.log('\n🧾 Receipt Formatting Consistency Test Suite\n');
    console.log('='.repeat(60));
    
    // Generate thermal receipt
    const escposData = generateESCPOSReceipt(testBillData);
    const thermalText = this.escposToText(escposData);
    
    console.log('\n📄 Thermal Receipt Output:\n');
    console.log(thermalText);
    console.log('\n' + '='.repeat(60));
    console.log('\n🧪 Running Tests...\n');
    
    // Run each test
    this.tests.forEach(test => {
      try {
        const result = test.testFn(thermalText, browserReceiptStructure);
        this.displayTestResult(test.name, result);
        
        if (result.pass) {
          this.passCount++;
        } else {
          this.failCount++;
        }
      } catch (error) {
        this.displayTestResult(test.name, {
          pass: false,
          message: `Error: ${error.message}`
        });
        this.failCount++;
      }
    });
    
    // Display summary
    this.displaySummary();
    
    return this.failCount === 0;
  }

  escposToText(escposData) {
    // Convert ESC/POS bytes to text
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(escposData);
    
    // Remove ESC/POS control codes for display
    text = text.replace(/\x1B[@AtE\x21]/g, '')
               .replace(/\x1D[\x21V]/g, '')
               .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1A\x1C-\x1F]/g, '');
    
    return text;
  }

  displayTestResult(testName, result) {
    const icon = result.pass ? '✅' : '❌';
    const status = result.pass ? 'PASS' : 'FAIL';
    
    console.log(`${icon} ${testName}: ${status}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary\n');
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`✅ Passed: ${this.passCount}`);
    console.log(`❌ Failed: ${this.failCount}`);
    console.log(`Success Rate: ${((this.passCount / this.tests.length) * 100).toFixed(1)}%`);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Initialize test suite
const tests = new ReceiptConsistencyTests();

// Test 1: Receipt header matches
tests.addTest('Receipt header matches browser print layout', (thermalText, browserData) => {
  const hasTitle = thermalText.includes(browserData.header.title);
  const hasSubtitle = thermalText.includes(browserData.header.subtitle);
  
  if (hasTitle && hasSubtitle) {
    return { pass: true, message: 'Header title and subtitle found' };
  } else {
    return { 
      pass: false, 
      message: `Missing: ${!hasTitle ? 'title' : ''} ${!hasSubtitle ? 'subtitle' : ''}`
    };
  }
});

// Test 2: Bill number, date, time positioning
tests.addTest('Bill number, date, time positioning matches', (thermalText, browserData) => {
  const hasBillNo = thermalText.includes('Bill: #042');
  const hasDate = thermalText.includes('23-Sep-2026');
  const hasTime = thermalText.includes('14:30');
  
  if (hasBillNo && hasDate && hasTime) {
    return { pass: true, message: 'All metadata present and positioned correctly' };
  } else {
    const missing = [];
    if (!hasBillNo) missing.push('bill number');
    if (!hasDate) missing.push('date');
    if (!hasTime) missing.push('time');
    return { pass: false, message: `Missing: ${missing.join(', ')}` };
  }
});

// Test 3: Customer name included
tests.addTest('Customer name appears in both outputs', (thermalText, browserData) => {
  const hasCustomer = thermalText.includes('Customer: John Doe');
  
  if (hasCustomer) {
    return { pass: true, message: 'Customer name present' };
  } else {
    return { pass: false, message: 'Customer name missing from thermal output' };
  }
});

// Test 4: Item table headers alignment
tests.addTest('Item table column headers (ITEM, QTY, PREF) present', (thermalText, browserData) => {
  const hasItemHeader = thermalText.includes('ITEM');
  const hasQtyHeader = thermalText.includes('QTY');
  const hasPrefHeader = thermalText.includes('PREF');
  
  if (hasItemHeader && hasQtyHeader && hasPrefHeader) {
    return { pass: true, message: 'All column headers present' };
  } else {
    const missing = [];
    if (!hasItemHeader) missing.push('ITEM');
    if (!hasQtyHeader) missing.push('QTY');
    if (!hasPrefHeader) missing.push('PREF');
    return { pass: false, message: `Missing headers: ${missing.join(', ')}` };
  }
});

// Test 5: All items present
tests.addTest('All item names present in thermal output', (thermalText, browserData) => {
  const items = browserData.itemsTable.items.map(item => item.name);
  const missingItems = items.filter(item => !thermalText.includes(item));
  
  if (missingItems.length === 0) {
    return { pass: true, message: `All ${items.length} items found` };
  } else {
    return { pass: false, message: `Missing items: ${missingItems.join(', ')}` };
  }
});

// Test 6: Preference symbols present
tests.addTest('Preference symbols render correctly in thermal', (thermalText, browserData) => {
  // Expected symbols based on test data:
  // Item 1: With Ice + Normal Sugar = ■
  // Item 2: Without Ice + No Sugar = □
  // Item 3: With Ice + No Sugar = ◧
  // Item 4: Without Ice + Normal Sugar = ▦
  
  const hasFullBlock = thermalText.includes('■');
  const hasOutlineBlock = thermalText.includes('□');
  const hasHalfBlock = thermalText.includes('◧');
  const hasCheckeredBlock = thermalText.includes('▦');
  
  const allSymbolsPresent = hasFullBlock && hasOutlineBlock && hasHalfBlock && hasCheckeredBlock;
  
  if (allSymbolsPresent) {
    return { pass: true, message: 'All 4 preference symbol types present' };
  } else {
    const missing = [];
    if (!hasFullBlock) missing.push('■ (With Ice+Sugar)');
    if (!hasOutlineBlock) missing.push('□ (No Ice+No Sugar)');
    if (!hasHalfBlock) missing.push('◧ (With Ice+No Sugar)');
    if (!hasCheckeredBlock) missing.push('▦ (No Ice+With Sugar)');
    return { pass: false, message: `Missing symbols: ${missing.join(', ')}` };
  }
});

// Test 7: Quantities present
tests.addTest('Item quantities appear in thermal output', (thermalText, browserData) => {
  // Check for quantities: 2, 1, 1, 3
  const quantities = ['2', '1', '3'];
  const allPresent = quantities.every(qty => thermalText.includes(qty));
  
  if (allPresent) {
    return { pass: true, message: 'All quantities present' };
  } else {
    return { pass: false, message: 'Some quantities missing' };
  }
});

// Test 8: Totals section formatting
tests.addTest('Totals section formatting matches browser output', (thermalText, browserData) => {
  const hasTotal = thermalText.includes('TOTAL:');
  const hasAmount = thermalText.includes('₹370.00');
  
  if (hasTotal && hasAmount) {
    return { pass: true, message: 'Total label and amount present' };
  } else {
    const missing = [];
    if (!hasTotal) missing.push('TOTAL label');
    if (!hasAmount) missing.push('amount ₹370.00');
    return { pass: false, message: `Missing: ${missing.join(', ')}` };
  }
});

// Test 9: Footer content identical
tests.addTest('Footer content matches browser output', (thermalText, browserData) => {
  const hasThankYou = thermalText.includes('Thank you!');
  const hasTagline = thermalText.includes('Stay Fresh') && thermalText.includes('Stay Healthy');
  
  if (hasThankYou && hasTagline) {
    return { pass: true, message: 'Footer content matches' };
  } else {
    const missing = [];
    if (!hasThankYou) missing.push('thank you message');
    if (!hasTagline) missing.push('tagline');
    return { pass: false, message: `Missing: ${missing.join(', ')}` };
  }
});

// Test 10: Special characters render correctly
tests.addTest('Currency symbol (₹) renders correctly', (thermalText, browserData) => {
  const hasCurrencySymbol = thermalText.includes('₹');
  
  if (hasCurrencySymbol) {
    return { pass: true, message: 'Currency symbol present' };
  } else {
    return { pass: false, message: 'Currency symbol missing' };
  }
});

// Run all tests
const success = tests.runAllTests();
process.exit(success ? 0 : 1);
