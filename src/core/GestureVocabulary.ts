// GestureVocabulary - Standardized 10-gesture vocabulary for 3D interactions
// Provides declarative gesture→action mapping configuration

import { GestureName, Landmark, GestureVocabularyConfig } from './types.js';

export const GESTURE_VOCABULARY: Record<GestureName, { 
  icon: string; 
  description: string;
  aliases: string[];
}> = {
  Open: {
    icon: '🖐️',
    description: 'Open hand — orbit view / explode / reset',
    aliases: ['Open_Hand', 'OpenHand', 'open']
  },
  Fist: {
    icon: '✊',
    description: 'Closed fist — zoom target / implode / black hole',
    aliases: ['Closed_Fist', 'Fist', 'fist']
  },
  Point: {
    icon: '☝️',
    description: 'Index finger pointing — select next / gravity well',
    aliases: ['Pointing', 'Point', 'point']
  },
  Pinch: {
    icon: '🤏',
    description: 'Thumb + index pinch — zoom in / color shift / previous',
    aliases: ['Pinch', 'pinch']
  },
  Peace: {
    icon: '✌️',
    description: 'Index + middle spread — time fast / explode / split',
    aliases: ['Peace', 'peace']
  },
  Stop: {
    icon: '🛑',
    description: 'Four fingers up — pause / stop time',
    aliases: ['Stop', 'Four', 'stop']
  },
  ThumbsUp: {
    icon: '👍',
    description: 'Thumbs up — time fast / turbulence',
    aliases: ['Thumbs_Up', 'ThumbUp', 'thumbsup']
  },
  Rock: {
    icon: '🤘',
    description: 'Index + pinky (rock horns) — turbulence / turbulence',
    aliases: ['Rock', 'Horns', 'rock']
  },
  Shaka: {
    icon: '🤙',
    description: 'Thumb + pinky (shaka) — spin / spin fast',
    aliases: ['Shaka', 'shaka']
  },
  Vulcan: {
    icon: '🖖',
    description: 'Vulcan salute (split fingers) — color shift',
    aliases: ['Vulcan', 'Spock', 'vulcan']
  },
  Neutral: {
    icon: '✋',
    description: 'No recognized gesture — idle / gentle recovery',
    aliases: ['Neutral', 'None', 'neutral']
  }
};

export class GestureVocabulary {
  private config: Required<GestureVocabularyConfig>;
  private customDetectors: Map<string, (landmarks: Landmark[]) => boolean>;

  constructor(config: GestureVocabularyConfig = {}) {
    this.config = {
      customGestures: config.customGestures || {},
      debounceMs: config.debounceMs ?? 300,
      minConfidence: config.minConfidence ?? 0.7
    };
    this.customDetectors = new Map(Object.entries(this.config.customGestures));
  }

  // Main detection function - maps MediaPipe landmarks to standardized gesture
  detect(landmarks: Landmark[]): GestureName {
    if (!landmarks || landmarks.length < 21) return 'Neutral';

    // Check custom gestures first
    for (const [name, detector] of this.customDetectors) {
      if (detector(landmarks)) return name as GestureName;
    }

    // Standard 10-gesture detection
    return this.detectStandardGestures(landmarks);
  }

  private detectStandardGestures(landmarks: Landmark[]): GestureName {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Distance helper
    const dist = (p1: Landmark, p2: Landmark) => 
      Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);

    // Finger extension check (distance from wrist)
    const isExtended = (tipIdx: number, pipIdx: number) => 
      dist(landmarks[tipIdx], wrist) > dist(landmarks[pipIdx], wrist);

    const indexOpen = isExtended(8, 6);
    const middleOpen = isExtended(12, 10);
    const ringOpen = isExtended(16, 14);
    const pinkyOpen = isExtended(20, 18);
    const thumbOpen = dist(thumbTip, wrist) > dist(landmarks[2], wrist);

    const openCount = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;
    const pinchDist = dist(thumbTip, indexTip);

    // 1. PINCH (Thumb + Index very close) - highest priority
    if (pinchDist < 0.06) return 'Pinch';

    // 2. FIST (All closed)
    if (openCount === 0 && !thumbOpen) return 'Fist';

    // 3. OPEN HAND (All open)
    if (openCount === 4 && thumbOpen) return 'Open';

    // 4. POINT (Index only)
    if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return 'Point';

    // 5. PEACE (Index + Middle spread)
    if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
      const spread = dist(indexTip, middleTip);
      if (spread > 0.05) return 'Peace';
    }

    // 6. STOP (Four fingers straight up, close together)
    if (openCount === 4 && dist(indexTip, pinkyTip) < 0.15) return 'Stop';

    // 7. THUMBS UP (Thumb only, pointing up)
    if (thumbOpen && !indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
      // Check thumb is higher than wrist (pointing up)
      if (thumbTip.y < wrist.y) return 'ThumbsUp';
    }

    // 8. ROCK (Index + Pinky)
    if (indexOpen && !middleOpen && !ringOpen && pinkyOpen) return 'Rock';

    // 9. SHAKA (Thumb + Pinky)
    if (thumbOpen && !indexOpen && !middleOpen && !ringOpen && pinkyOpen) return 'Shaka';

    // 10. VULCAN (Split - Index+Middle vs Ring+Pinky)
    // Approximation: four fingers open, thumb closed
    if (!thumbOpen && openCount === 4) return 'Vulcan';

    return 'Neutral';
  }

  // Get gesture metadata
  getGestureInfo(name: GestureName) {
    return GESTURE_VOCABULARY[name] || GESTURE_VOCABULARY.Neutral;
  }

  // Get all gesture names
  getAllGestures(): GestureName[] {
    return Object.keys(GESTURE_VOCABULARY) as GestureName[];
  }

  // Add custom gesture detector
  addCustomGesture(name: string, detector: (landmarks: Landmark[]) => boolean) {
    this.customDetectors.set(name, detector);
  }

  // Remove custom gesture
  removeCustomGesture(name: string) {
    this.customDetectors.delete(name);
  }

  // Update configuration
  updateConfig(config: Partial<GestureVocabularyConfig>) {
    this.config = { ...this.config, ...config };
    if (config.customGestures) {
      this.customDetectors = new Map(Object.entries(config.customGestures));
    }
  }

  getConfig(): Required<GestureVocabularyConfig> {
    return { ...this.config };
  }
}

// Default export for convenience
export const defaultVocabulary = new GestureVocabulary();