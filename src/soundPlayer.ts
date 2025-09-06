/**
 * Simple sound player
 * Loads sounds immediately and plays them when ready
 */

export const SoundType = {
  BUTTON_PRESS: 'button-press',
  HIT: 'hit',
  SCORE_REACHED: 'score-reached'
} as const;
export type SoundType = typeof SoundType[keyof typeof SoundType];

// Sound storage
const sounds = new Map<SoundType, AudioBuffer>();
let audioContext: AudioContext | null = null;

// Detect iOS (where Web Audio has limitations)
const isIOS = /iPad|iPhone|iPod/.test(navigator.platform);

// Initialize audio context and load sounds immediately
if (!isIOS) {
  try {
    audioContext = new AudioContext();
    loadSounds().then();
  } catch (error) {
    console.warn('Web Audio API not supported:', error);
  }
}

async function loadSounds() {
  if (!audioContext) return;

  const soundUrls = {
    [SoundType.BUTTON_PRESS]: '/sounds/button-press.mp3',
    [SoundType.HIT]: '/sounds/hit.mp3',
    [SoundType.SCORE_REACHED]: '/sounds/score-reached.mp3'
  };

  // Load all sounds in parallel
  await Promise.all(
    Object.entries(soundUrls).map(async ([type, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return;

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
        sounds.set(type as SoundType, audioBuffer);
      } catch (error) {
        console.warn(`Failed to load sound ${type}:`, error);
      }
    })
  );

  console.log('SoundPlayer loaded', sounds.size, 'sounds');
}

// Track last play times to prevent audio spam
const lastPlayTimes = new Map<SoundType, number>();
const MIN_PLAY_INTERVAL = 200;

/**
 * Play a sound effect
 * Does nothing if sounds aren't loaded yet or on iOS
 */
export function playSound(type: SoundType): void {
  if (!audioContext || isIOS || !sounds.has(type)) {
    return;
  }

  // Resume audio context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(console.warn);
  }

  // Prevent audio spam
  const now = Date.now();
  const lastPlayTime = lastPlayTimes.get(type) || 0;
  if (now - lastPlayTime < MIN_PLAY_INTERVAL) {
    return;
  }
  lastPlayTimes.set(type, now);

  try {
    const buffer = sounds.get(type)!;
    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.connect(audioContext.destination);
    sourceNode.start(0);
  } catch (error) {
    console.warn(`Failed to play sound ${type}:`, error);
  }
}
