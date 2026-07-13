/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppMode = 'simulation' | 'real';

export interface DetectionResult {
  className: string;
  probability: number;
}

export interface PredictionState {
  label: string;
  confidence: number;
  allPredictions: DetectionResult[];
}

export interface SmartHomeSettings {
  lightColor: string;
  brightness: number;
}

export interface GameState {
  distance: number;
  speed: number;
  score: number;
  isJumping: boolean;
}
