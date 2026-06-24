// === Game dimensions ===
export const GAME_WIDTH = 480
export const GAME_HEIGHT = 270

// === Colors ===
export const COLORS = {
  BACKGROUND: '#000000',
  WHITE: '#ffffff',
  BLACK: '#000000',
  RED: '#e74c3c',
  GREEN: '#2ecc71',
  BLUE: '#3498db',
  YELLOW: '#f1c40f',
  PINK: '#ff69b4',
  GRAY: '#666666',
  LIGHT_GRAY: '#aaaaaa',
}

// === Christele (player) ===
export const CHRISTELE = {
  SPEED: 120,              // px/s
  FIRE_RATE: 6,            // shots/s
  DASH_SPEED: 1000,        // px/s during dash
  DASH_DURATION: 250,      // ms (longer = more visible)
  DASH_COOLDOWN: 2000,     // ms
  DASH_AFTERGLOW: 250,     // ms of residual transparency after dash
  HEAL_COOLDOWN: 15000,    // ms
  HEAL_AMOUNT: 0.3,        // fraction of max HP
  HITBOX_W: 16,            // 16 wide (matches visible torso + sacoche width)
  HITBOX_H: 28,            // 28 tall (matches full visible height: head→legs)
  MAX_HP: 5,
  SPRITE_W: 24,
  SPRITE_H: 32,
}

// === Syringe (default weapon) ===
export const SYRINGE = {
  SPEED: 280,              // px/s (slow enough to see clearly)
  DAMAGE: 1,
  POOL_SIZE: 50,
  HITBOX_W: 16,            // horizontal fire: 16w x 6h
  HITBOX_H: 6,
  HITBOX_V_W: 6,           // vertical fire: 6w x 16h (swapped to match rotated sprite)
  HITBOX_V_H: 16,
  LIFETIME: 3000,          // ms
}

// === Enemies (defaults) ===
export const ENEMY_DEFAULTS = {
  CONTACT_DAMAGE: 1,
  POINTS: 100,
  DROP_CHANCE: 0.1,        // 10% chance to drop a power-up
}

// === Boss ===
export const BOSS_BAR_DURATION = 2000  // ms, duration of intro animation

// === Game balance ===
export const INITIAL_LIVES = 3
export const MAX_LIVES = 5

// === Scenes (registered names) ===
export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  TRANSITION: 'TransitionScene',
  PATIENT: 'PatientLevelScene',
  TRAJET: 'TrajetLevelScene',
  END: 'EndScene',
}

// === Audio ===
export const AUDIO = {
  MUSIC_VOLUME: 0.7,
  SFX_VOLUME: 0.8,
}

// === Input mapping ===
// Supports both AZERTY (Z/Q/S/D) and QWERTY (W/A/S/D) layouts + arrow keys.
// Fire is on F (universally available, no layout conflict).
export const INPUT = {
  KEY_MOVE_UP: ['KeyW', 'KeyZ', 'ArrowUp'],
  KEY_MOVE_DOWN: ['KeyS', 'ArrowDown'],
  KEY_MOVE_LEFT: ['KeyA', 'KeyQ', 'ArrowLeft'],
  KEY_MOVE_RIGHT: ['KeyD', 'ArrowRight'],
  KEY_FIRE: ['KeyF', 'KeyJ'],
  KEY_SECONDARY: ['KeyE', 'KeyK'],
  KEY_DASH: ['Space'],
  KEY_HEAL: ['ShiftLeft', 'ShiftRight'],
  KEY_PAUSE: ['Escape'],
  KEY_MUTE: ['KeyM'],
}

// === Local storage keys ===
export const STORAGE_KEYS = {
  HIGH_SCORE: 'christele.highScore',
  AUDIO_MUTED: 'christele.audioMuted',
  MUSIC_VOLUME: 'christele.musicVolume',
  SFX_VOLUME: 'christele.sfxVolume',
  INPUT_MODE: 'christele.inputMode',
}
