/**
 * Real-Time Movement Prediction System for 3D Café Map
 * 
 * This system predicts and smoothly interpolates the exact moments of 3D model movements
 * in the café by combining multiple data sources and predictive algorithms.
 */

import * as THREE from 'three';
import { lerp, easing } from './utils.js';
import { ANIMATION_CONFIG, STATUS_COLORS } from './config.js';

export class RealTimePredictor {
  constructor() {
    this.predictions = new Map(); // Store predictions for each table
    this.interpolationStates = new Map(); // Current interpolation states
    this.lastFirebaseUpdate = 0;
    this.updateFrequency = 16; // 60fps updates
    this.predictionHorizon = 5000; // Predict 5 seconds into the future
    
    // Historical data for pattern recognition
    this.statusHistory = new Map();
    this.timingPatterns = new Map();
    
    // Performance tracking
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
  }

  /**
   * CORE PREDICTION ALGORITHM
   * Analyzes Firebase data, historical patterns, and current states to predict movements
   */
  predictTableMovements(firebaseData, currentTime = performance.now()) {
    if (!firebaseData?.orders) return new Map();

    const predictions = new Map();
    
    firebaseData.orders.forEach(order => {
      const tableId = `table-${order.tableNumber}`;
      if (!tableId || !order.tableNumber) return;

      // Analyze current order state
      const orderAnalysis = this.analyzeOrderState(order, currentTime);
      
      // Predict next status transitions
      const statusPrediction = this.predictStatusTransition(order, orderAnalysis);
      
      // Calculate movement interpolation
      const movementPrediction = this.predictTableMovement(tableId, statusPrediction, currentTime);
      
      predictions.set(tableId, {
        orderId: order.id,
        currentStatus: order.status,
        predictedStatus: statusPrediction.nextStatus,
        transitionProbability: statusPrediction.confidence,
        expectedTransitionTime: statusPrediction.expectedTime,
        movementData: movementPrediction,
        lastUpdate: currentTime
      });
    });

    return predictions;
  }

  /**
   * Analyzes current order state for prediction
   */
  analyzeOrderState(order, currentTime) {
    const createdAt = order.createdAt || currentTime;
    const elapsedTime = currentTime - createdAt;
    
    // Get historical pattern for this status
    const pattern = this.getStatusPattern(order.status);
    
    return {
      elapsedTime,
      status: order.status,
      itemCount: (order.items || []).length,
      complexity: this.calculateOrderComplexity(order.items || []),
      typicalDuration: pattern.averageDuration,
      progressRatio: Math.min(elapsedTime / pattern.averageDuration, 1.0)
    };
  }

  /**
   * Predicts the next status transition using ML-like approach
   */
  predictStatusTransition(order, analysis) {
    const currentStatus = order.status;
    const transitions = {
      'pending': { next: 'preparing', baseTime: 30000 }, // 30 seconds
      'preparing': { next: 'ready', baseTime: 300000 }, // 5 minutes
      'ready': { next: 'served', baseTime: 120000 }, // 2 minutes
      'served': { next: 'paid', baseTime: 180000 }, // 3 minutes
      'paid': { next: 'free', baseTime: 60000 } // 1 minute cleanup
    };

    const transition = transitions[currentStatus];
    if (!transition) return { nextStatus: currentStatus, confidence: 0, expectedTime: 0 };

    // Adjust timing based on order complexity and historical data
    let adjustedTime = transition.baseTime;
    
    // Complexity adjustment
    adjustedTime *= (1 + analysis.complexity * 0.3);
    
    // Historical pattern adjustment
    const pattern = this.getStatusPattern(currentStatus);
    if (pattern.samples > 5) {
      adjustedTime = lerp(adjustedTime, pattern.averageDuration, 0.7);
    }
    
    // Calculate confidence based on elapsed time
    const progressRatio = analysis.elapsedTime / adjustedTime;
    let confidence = Math.min(progressRatio, 1.0);
    
    // Sigmoid function for smooth confidence transition
    confidence = 1 / (1 + Math.exp(-5 * (progressRatio - 0.5)));

    return {
      nextStatus: transition.next,
      confidence: Math.max(0.1, Math.min(0.95, confidence)),
      expectedTime: Math.max(0, adjustedTime - analysis.elapsedTime),
      adjustedDuration: adjustedTime
    };
  }

  /**
   * Predicts smooth table movement (color transitions, scale changes, etc.)
   */
  predictTableMovement(tableId, statusPrediction, currentTime) {
    const existing = this.interpolationStates.get(tableId) || {
      currentColor: STATUS_COLORS.free,
      targetColor: STATUS_COLORS.free,
      scale: 1.0,
      targetScale: 1.0,
      opacity: 1.0,
      targetOpacity: 1.0,
      lastUpdateTime: currentTime
    };

    // Calculate target visual state based on predicted status
    const targetColor = STATUS_COLORS[statusPrediction.nextStatus] || STATUS_COLORS.free;
    
    // Scale animation based on confidence
    const confidenceScale = 1.0 + (statusPrediction.confidence * 0.05);
    
    // Opacity for transition visualization
    const transitionOpacity = statusPrediction.confidence > 0.8 ? 
      0.9 + Math.sin(currentTime * 0.005) * 0.1 : 1.0;

    return {
      ...existing,
      targetColor,
      targetScale: confidenceScale,
      targetOpacity: transitionOpacity,
      transitionSpeed: this.calculateTransitionSpeed(statusPrediction.confidence),
      predictedTransitionTime: statusPrediction.expectedTime,
      lastUpdateTime: currentTime
    };
  }

  /**
   * Interpolate visual properties for smooth animations
   */
  interpolateVisuals(tableId, deltaTime) {
    const state = this.interpolationStates.get(tableId);
    if (!state) return null;

    const speed = state.transitionSpeed || 0.05;
    
    // Smooth color interpolation
    const currentColor = new THREE.Color(state.currentColor);
    const targetColor = new THREE.Color(state.targetColor);
    currentColor.lerp(targetColor, speed);
    
    // Smooth scale interpolation
    const currentScale = lerp(state.scale, state.targetScale, speed);
    
    // Smooth opacity interpolation
    const currentOpacity = lerp(state.opacity, state.targetOpacity, speed * 0.5);
    
    // Update interpolation state
    this.interpolationStates.set(tableId, {
      ...state,
      currentColor: `#${currentColor.getHexString()}`,
      scale: currentScale,
      opacity: currentOpacity
    });

    return {
      color: currentColor,
      scale: currentScale,
      opacity: currentOpacity,
      needsUpdate: this.hasSignificantChange(state, currentColor, currentScale, currentOpacity)
    };
  }

  /**
   * Calculate order complexity for timing adjustments
   */
  calculateOrderComplexity(items) {
    if (!items || items.length === 0) return 0;
    
    let complexity = 0;
    
    items.forEach(item => {
      // Base complexity per item
      complexity += 0.1;
      
      // Additional complexity for customizations
      if (item.size && item.size !== 'Regular') complexity += 0.05;
      if (item.ice && item.ice !== 'With Ice') complexity += 0.03;
      if (item.sugar && item.sugar !== 'Normal Sugar') complexity += 0.03;
      if (item.note) complexity += 0.1;
      
      // Complexity based on quantity
      const quantity = item.qty || item.quantity || 1;
      if (quantity > 1) complexity += (quantity - 1) * 0.02;
    });
    
    return Math.min(complexity, 1.0); // Cap at 1.0
  }

  /**
   * Get historical pattern data for a status
   */
  getStatusPattern(status) {
    const defaultPattern = {
      averageDuration: 180000, // 3 minutes default
      samples: 0,
      variance: 0.3
    };
    
    return this.timingPatterns.get(status) || defaultPattern;
  }

  /**
   * Update historical patterns with new data
   */
  updateHistoricalPattern(status, duration) {
    const existing = this.getStatusPattern(status);
    const samples = existing.samples + 1;
    
    // Exponentially weighted moving average
    const alpha = Math.min(0.2, 1.0 / samples);
    const newAverage = existing.averageDuration * (1 - alpha) + duration * alpha;
    
    this.timingPatterns.set(status, {
      averageDuration: newAverage,
      samples: samples,
      variance: existing.variance // Simplified - could calculate actual variance
    });
  }

  /**
   * Calculate transition speed based on confidence
   */
  calculateTransitionSpeed(confidence) {
    // Higher confidence = faster transitions
    const baseSpeed = ANIMATION_CONFIG.statusTransition.duration || 0.3;
    return baseSpeed * (0.5 + confidence * 1.5);
  }

  /**
   * Check if visual change is significant enough to trigger update
   */
  hasSignificantChange(state, newColor, newScale, newOpacity) {
    const colorThreshold = 0.01;
    const scaleThreshold = 0.005;
    const opacityThreshold = 0.01;
    
    const currentColor = new THREE.Color(state.currentColor);
    const colorDistance = currentColor.distanceTo(newColor);
    
    return colorDistance > colorThreshold ||
           Math.abs(state.scale - newScale) > scaleThreshold ||
           Math.abs(state.opacity - newOpacity) > opacityThreshold;
  }

  /**
   * Main update loop - call this every frame
   */
  update(firebaseData, currentTime = performance.now()) {
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.frameCount++;

    // Update predictions (throttled to avoid excessive computation)
    if (currentTime - this.lastFirebaseUpdate > this.updateFrequency) {
      this.predictions = this.predictTableMovements(firebaseData, currentTime);
      this.lastFirebaseUpdate = currentTime;
    }

    // Interpolate all table visuals
    const interpolatedStates = new Map();
    this.predictions.forEach((prediction, tableId) => {
      const visualState = this.interpolateVisuals(tableId, deltaTime);
      if (visualState && visualState.needsUpdate) {
        interpolatedStates.set(tableId, visualState);
      }
    });

    return {
      predictions: this.predictions,
      interpolatedStates,
      fps: this.frameCount / Math.max(1, (currentTime - this.lastFrameTime) / 1000),
      predictionCount: this.predictions.size
    };
  }

  /**
   * Get prediction for specific table
   */
  getPredictionForTable(tableId) {
    return this.predictions.get(tableId) || null;
  }

  /**
   * Get all current predictions
   */
  getAllPredictions() {
    return new Map(this.predictions);
  }

  /**
   * Reset all predictions and states
   */
  reset() {
    this.predictions.clear();
    this.interpolationStates.clear();
    this.statusHistory.clear();
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
  }
}

// Singleton instance for global use
export const realTimePredictor = new RealTimePredictor();

export default realTimePredictor;