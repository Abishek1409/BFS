/**
 * Command-line validation script for thermal printer preference symbols
 * Tests the getPreferenceSymbol function from escpos-receipt.js
 */

// Load the ESC/POS receipt module
const escpos = require('./escpos-receipt.js');

const { getPreferenceSymbol, setASCIIFallback } = escpos;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test cases
const testCases = [
  {
    name: 'With Ice + With Sugar',
    item: { ice: 'With Ice', sugar: 'Normal Sugar' },
    expectedUnicode: '■',
    expectedASCII: '[X]'
  },
  {
    name: 'Without Ice + Without Sugar',
    item: { ice: 'Without Ice', sugar: 'No Sugar' },
    expectedUnicode: '□',
    expectedASCII: '[ ]'
  },
  {
    name: 'With Ice + No Sugar',
    item: { ice: 'With Ice', sugar: 'No Sugar' },
    expectedUnicode: '◧',
    expectedASCII: '[/]'
  },
  {
    name: 'Without Ice + With Sugar',
    item: { ice: 'Without Ice', sugar: 'Normal Sugar' },
    expectedUnicode: '▦',
    expectedASCII: '[#]'
  }
];

const noPreferenceTestCases = [
  {
    name: 'No ice, no sugar preference',
    item: {},
    expected: ''
  },
  {
    name: 'Only ice preference (no sugar)',
    item: { ice: 'With Ice' },
    expected: ''
  },
  {
    name: 'Only sugar preference (no ice)',
    item: { sugar: 'Normal Sugar' },
    expected: ''
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testCase, mode, expected) {
  totalTests++;
  
  // Get the symbol
  const result = getPreferenceSymbol(testCase.item);
  
  // Check if test passed
  const passed = result === expected;
  if (passed) {
    passedTests++;
  } else {
    failedTests++;
  }
  
  // Print result
  const status = passed 
    ? `${colors.green}✓ PASS${colors.reset}` 
    : `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`  ${status} ${testCase.name}`);
  console.log(`      Ice: ${testCase.item.ice || 'None'}, Sugar: ${testCase.item.sugar || 'None'}`);
  console.log(`      Expected: "${expected}", Got: "${result}"`);
  
  if (!passed) {
    console.log(`      ${colors.red}Mismatch detected!${colors.reset}`);
  }
  console.log('');
}

function printHeader(text) {
  console.log('');
  console.log(`${colors.cyan}${colors.bold}${text}${colors.reset}`);
  console.log('='.repeat(text.length));
  console.log('');
}

function printSummary() {
  console.log('');
  console.log('='.repeat(60));
  console.log(`${colors.bold}VALIDATION SUMMARY${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (failedTests === 0) {
    console.log(`${colors.green}${colors.bold}🎉 All tests passed! Preference symbols render correctly.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️  ${failedTests} test(s) failed. Please review the output above.${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
console.log('');
console.log(`${colors.bold}${colors.cyan}╔${'═'.repeat(58)}╗${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}║  THERMAL PRINTER PREFERENCE SYMBOL VALIDATION${' '.repeat(12)}║${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}╚${'═'.repeat(58)}╝${colors.reset}`);

// Unicode mode tests
printHeader('Unicode Mode Tests');
setASCIIFallback(false);
testCases.forEach(test => runTest(test, 'unicode', test.expectedUnicode));

// ASCII mode tests
printHeader('ASCII Fallback Mode Tests');
setASCIIFallback(true);
testCases.forEach(test => runTest(test, 'ascii', test.expectedASCII));

// No preference tests
printHeader('No Preference Tests');
setASCIIFallback(false);
noPreferenceTestCases.forEach(test => runTest(test, 'none', test.expected));

// Print summary
printSummary();
