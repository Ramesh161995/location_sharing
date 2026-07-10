/**
 * Battery optimization utilities and hints
 */

export interface BatteryHint {
  level: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}

/**
 * Calculate estimated battery impact based on tracking settings
 */
export function getBatteryImpact(
  updateInterval: number, // milliseconds
  accuracy: 'lowest' | 'low' | 'balanced' | 'high' | 'highest' | 'bestForNavigation'
): BatteryHint {
  const intervalMinutes = updateInterval / 60000;
  
  // High accuracy and frequent updates = high battery drain
  const accuracyMultiplier = {
    'lowest': 0.3,
    'low': 0.5,
    'balanced': 1.0,
    'high': 1.5,
    'highest': 2.0,
    'bestForNavigation': 2.5,
  }[accuracy] || 1.0;
  
  const frequencyMultiplier = intervalMinutes < 5 ? 2.0 : intervalMinutes < 15 ? 1.5 : intervalMinutes < 60 ? 1.0 : 0.5;
  
  const impact = accuracyMultiplier * frequencyMultiplier;
  
  if (impact > 2.5) {
    return {
      level: 'high',
      message: 'High battery usage',
      suggestion: 'Consider increasing update interval to 15+ minutes or using balanced accuracy for better battery life.',
    };
  } else if (impact > 1.5) {
    return {
      level: 'medium',
      message: 'Moderate battery usage',
      suggestion: 'Update interval and accuracy settings are reasonable. Battery usage is moderate.',
    };
  } else {
    return {
      level: 'low',
      message: 'Low battery usage',
      suggestion: 'Battery-friendly settings. Location updates are optimized for battery life.',
    };
  }
}

/**
 * Get recommended settings for battery optimization
 */
export function getBatteryOptimizedSettings() {
  return {
    updateInterval: 60000, // 1 minute
    distanceInterval: 100, // 100 meters
    accuracy: 'balanced' as const,
  };
}

/**
 * Format battery hint message for display
 */
export function formatBatteryHint(hint: BatteryHint): string {
  return `${hint.message}: ${hint.suggestion}`;
}

/**
 * Get battery optimization tips
 */
export function getBatteryOptimizationTips(): string[] {
  return [
    'Use "Balanced" accuracy instead of "High" for better battery life',
    'Increase update interval to 15+ minutes when not actively moving',
    'Stop tracking when not needed to preserve battery',
    'Enable battery saver mode on your device for additional savings',
    'Close other location-based apps when using this app',
  ];
}

