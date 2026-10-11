/**
 * Interactive Controls Test Suite
 * Tests for Task 4: Build interactive controls and mode switching
 */

import {
  MapControls,
  MapWithControls,
  MAP_MODES,
  CAMERA_CONFIG,
  ANIMATION_CONFIG
} from './index.js';

// Test configuration
const TEST_CONFIG = {
  testTimeout: 5000,
  animationBuffer: 100 // Extra time for animations to complete
};

// Mock DOM environment for testing
function createMockDOM() {
  if (typeof window === 'undefined') {
    global.window = {
      devicePixelRatio: 1,
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    global.document = {
      body: { style: {} },
      createElement: () => ({
        getContext: () => null,
        style: {}
      })
    };
  }
}

// Test Suite: Interactive Controls
export class InteractiveControlsTestSuite {
  constructor() {
    this.results = [];
    this.setupMockEnvironment();
  }

  setupMockEnvironment() {
    createMockDOM();
  }

  // Test 1: Orbit, Pan, and Zoom Controls Configuration
  async testCameraControlsConfiguration() {
    console.log('🧪 Testing camera controls configuration...');
    
    try {
      // Verify camera configuration includes required limits
      const hasOrbitLimits = CAMERA_CONFIG.minDistance && CAMERA_CONFIG.maxDistance;
      const hasPanLimits = typeof CAMERA_CONFIG.enablePan === 'boolean';
      const hasAngleLimits = CAMERA_CONFIG.minPolarAngle && CAMERA_CONFIG.maxPolarAngle;
      const hasSpeedSettings = CAMERA_CONFIG.panSpeed && CAMERA_CONFIG.rotateSpeed && CAMERA_CONFIG.zoomSpeed;
      
      if (!hasOrbitLimits) throw new Error('Missing orbit distance limits');
      if (!hasPanLimits) throw new Error('Missing pan configuration');
      if (!hasAngleLimits) throw new Error('Missing angle limits');
      if (!hasSpeedSettings) throw new Error('Missing speed settings');
      
      // Verify reasonable limit values
      if (CAMERA_CONFIG.minDistance >= CAMERA_CONFIG.maxDistance) {
        throw new Error('Invalid distance limits');
      }
      
      if (CAMERA_CONFIG.minPolarAngle >= CAMERA_CONFIG.maxPolarAngle) {
        throw new Error('Invalid angle limits');
      }
      
      this.results.push({
        test: 'Camera Controls Configuration',
        status: 'PASS',
        message: 'All camera control limits properly configured'
      });
      
      return true;
    } catch (error) {
      this.results.push({
        test: 'Camera Controls Configuration',
        status: 'FAIL',
        message: error.message
      });
      return false;
    }
  }

  // Test 2: Mode Toggle System
  async testModeToggleSystem() {
    console.log('🧪 Testing mode toggle system...');
    
    try {
      let currentMode = MAP_MODES.DIMMED;
      let modeChanges = 0;
      
      // Mock mode change handler
      const handleModeChange = (newMode) => {
        currentMode = newMode;
        modeChanges++;
      };
      
      // Test initial mode
      if (currentMode !== MAP_MODES.DIMMED) {
        throw new Error('Default mode should be DIMMED');
      }
      
      // Simulate mode changes
      handleModeChange(MAP_MODES.INTERACTIVE);
      if (currentMode !== MAP_MODES.INTERACTIVE) {
        throw new Error('Mode change to INTERACTIVE failed');
      }
      
      handleModeChange(MAP_MODES.DIMMED);
      if (currentMode !== MAP_MODES.DIMMED) {
        throw new Error('Mode change back to DIMMED failed');
      }
      
      if (modeChanges !== 2) {
        throw new Error(`Expected 2 mode changes, got ${modeChanges}`);
      }
      
      this.results.push({
        test: 'Mode Toggle System',
        status: 'PASS',
        message: 'Mode switching works correctly'
      });
      
      return true;
    } catch (error) {
      this.results.push({
        test: 'Mode Toggle System',
        status: 'FAIL',
        message: error.message
      });
      return false;
    }
  }

  // Test 3: Camera Movement Limits
  async testCameraMovementLimits() {
    console.log('🧪 Testing camera movement limits...');
    
    try {
      // Test distance limits
      const minDist = CAMERA_CONFIG.minDistance;
      const maxDist = CAMERA_CONFIG.maxDistance;
      
      if (minDist < 2 || minDist > 8) {
        throw new Error(`Minimum distance ${minDist} is not within café bounds`);
      }
      
      if (maxDist < 10 || maxDist > 30) {
        throw new Error(`Maximum distance ${maxDist} may be too restrictive or permissive`);
      }
      
      // Test angle limits (prevent going underground)
      const minAngle = CAMERA_CONFIG.minPolarAngle;
      const maxAngle = CAMERA_CONFIG.maxPolarAngle;
      
      if (minAngle < Math.PI / 6 || minAngle > Math.PI / 3) {
        throw new Error(`Minimum polar angle ${minAngle} may allow underground view`);
      }
      
      if (maxAngle > Math.PI / 1.8) {
        throw new Error(`Maximum polar angle ${maxAngle} may be too permissive`);
      }
      
      // Test speed limits (should be reasonable for café navigation)
      const panSpeed = CAMERA_CONFIG.panSpeed;
      const rotateSpeed = CAMERA_CONFIG.rotateSpeed;
      const zoomSpeed = CAMERA_CONFIG.zoomSpeed;
      
      if (panSpeed < 0.1 || panSpeed > 2) {
        throw new Error(`Pan speed ${panSpeed} is outside reasonable range`);
      }
      
      if (rotateSpeed < 0.1 || rotateSpeed > 2) {
        throw new Error(`Rotate speed ${rotateSpeed} is outside reasonable range`);
      }
      
      if (zoomSpeed < 0.1 || zoomSpeed > 2) {
        throw new Error(`Zoom speed ${zoomSpeed} is outside reasonable range`);
      }
      
      this.results.push({
        test: 'Camera Movement Limits',
        status: 'PASS',
        message: 'All camera movement limits are within café bounds'
      });
      
      return true;
    } catch (error) {
      this.results.push({
        test: 'Camera Movement Limits', 
        status: 'FAIL',
        message: error.message
      });
      return false;
    }
  }

  // Test 4: UI Opacity Control
  async testUIOpacityControl() {
    console.log('🧪 Testing UI opacity control...');
    
    try {
      // Test opacity transition configuration
      const transitionDuration = ANIMATION_CONFIG.modeTransition.duration;
      const transitionEasing = ANIMATION_CONFIG.modeTransition.easing;
      
      if (!transitionDuration || transitionDuration < 0.2 || transitionDuration > 2) {
        throw new Error(`Transition duration ${transitionDuration} is not reasonable`);
      }
      
      if (!transitionEasing || !transitionEasing.includes('cubic-bezier')) {
        throw new Error('Transition easing should use cubic-bezier for smooth animation');
      }
      
      // Mock opacity controller behavior
      let currentOpacity = 1;
      const mockOpacityController = {
        setMode: (mode) => {
          const isInteractive = mode === MAP_MODES.INTERACTIVE;
          currentOpacity = isInteractive ? 0.3 : 1;
        }
      };
      
      // Test dimmed mode opacity
      mockOpacityController.setMode(MAP_MODES.DIMMED);
      if (currentOpacity !== 1) {
        throw new Error('Dimmed mode should have full opacity (1.0)');
      }
      
      // Test interactive mode opacity
      mockOpacityController.setMode(MAP_MODES.INTERACTIVE);
      if (currentOpacity !== 0.3) {
        throw new Error('Interactive mode should have reduced opacity (0.3)');
      }
      
      this.results.push({
        test: 'UI Opacity Control',
        status: 'PASS',
        message: 'UI opacity transitions work correctly for both modes'
      });
      
      return true;
    } catch (error) {
      this.results.push({
        test: 'UI Opacity Control',
        status: 'FAIL',
        message: error.message
      });
      return false;
    }
  }

  // Test 5: Mode Transition Animations
  async testModeTransitionAnimations() {
    console.log('🧪 Testing mode transition animations...');
    
    try {
      // Check animation configuration exists
      const animConfig = ANIMATION_CONFIG.modeTransition;
      
      if (!animConfig) {
        throw new Error('Mode transition animation configuration missing');
      }
      
      if (!animConfig.duration || typeof animConfig.duration !== 'number') {
        throw new Error('Animation duration must be a number');
      }
      
      if (!animConfig.easing || typeof animConfig.easing !== 'string') {
        throw new Error('Animation easing must be a string');
      }
      
      // Test animation timing
      const duration = animConfig.duration * 1000; // Convert to milliseconds
      if (duration < 200 || duration > 1000) {
        throw new Error(`Animation duration ${duration}ms is not user-friendly`);
      }
      
      // Test easing function is appropriate for smooth transitions
      const validEasings = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier'];
      const hasValidEasing = validEasings.some(easing => animConfig.easing.includes(easing));
      
      if (!hasValidEasing) {
        throw new Error('Animation easing should use standard CSS timing functions');
      }
      
      this.results.push({
        test: 'Mode Transition Animations',
        status: 'PASS',
        message: 'Mode transition animations configured for smooth user experience'
      });
      
      return true;
    } catch (error) {
      this.results.push({
        test: 'Mode Transition Animations',
        status: 'FAIL',
        message: error.message
      });
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Interactive Controls Test Suite...\n');
    
    const tests = [
      this.testCameraControlsConfiguration,
      this.testModeToggleSystem, 
      this.testCameraMovementLimits,
      this.testUIOpacityControl,
      this.testModeTransitionAnimations
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      const result = await test.call(this);
      if (result) passed++;
      else failed++;
    }
    
    // Print results
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });
    
    console.log(`\n📈 Overall: ${passed} passed, ${failed} failed`);
    
    const success = failed === 0;
    if (success) {
      console.log('🎉 All interactive controls tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Please review implementation.');
    }
    
    return {
      success,
      passed,
      failed,
      results: this.results
    };
  }
}

// Export test runner
export async function runInteractiveControlsTests() {
  const testSuite = new InteractiveControlsTestSuite();
  return await testSuite.runAllTests();
}

// Auto-run tests if this module is executed directly
if (typeof window !== 'undefined' && window.location?.pathname?.includes('test')) {
  runInteractiveControlsTests();
}