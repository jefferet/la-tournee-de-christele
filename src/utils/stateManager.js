import { INITIAL_LIVES, MAX_LIVES, STORAGE_KEYS, COLORS } from '../config/constants.js'

/**
 * Global game state manager (singleton).
 * Holds session state (score, lives, weapons) + persistent state (high score, audio prefs).
 * See DOC-TECHNIQUE-V1.md section 25.
 */
class StateManager {
  constructor() {
    // === Session state (reset on "Rejouer") ===
    this.score = 0
    this.lives = INITIAL_LIVES
    this.equippedSecondary = null
    this.unlockedSecondaries = []
    this.currentLevelIndex = 0
    this.activeEffects = []
    this.isInvincible = false
    this.dashOnCooldown = false
    this.healOnCooldown = false

    // === Persistent state (localStorage) ===
    this.highScore = this._loadNumber(STORAGE_KEYS.HIGH_SCORE, 0)
    this.audioMuted = this._loadBool(STORAGE_KEYS.AUDIO_MUTED, false)
    this.musicVolume = this._loadNumber(STORAGE_KEYS.MUSIC_VOLUME, 0.7)
    this.sfxVolume = this._loadNumber(STORAGE_KEYS.SFX_VOLUME, 0.8)
  }

  // === Score ===

  addScore(points) {
    this.score += points
    if (this.score > this.highScore) {
      this.highScore = this.score
      this._saveNumber(STORAGE_KEYS.HIGH_SCORE, this.highScore)
    }
  }

  // === Lives ===

  loseLife() {
    this.lives = Math.max(0, this.lives - 1)
  }

  gainLife() {
    this.lives = Math.min(MAX_LIVES, this.lives + 1)
  }

  // === Effects ===

  addEffect(effect) {
    // effect = { type, duration, ...payload }
    this.activeEffects.push({
      ...effect,
      expiresAt: this._now() + (effect.duration || 0),
    })
  }

  clearExpiredEffects() {
    const now = this._now()
    this.activeEffects = this.activeEffects.filter(e => e.expiresAt > now)
  }

  hasEffect(type) {
    return this.activeEffects.some(e => e.type === type)
  }

  // === Reset ===

  reset() {
    this.score = 0
    this.lives = INITIAL_LIVES
    this.equippedSecondary = null
    this.unlockedSecondaries = []
    this.currentLevelIndex = 0
    this.activeEffects = []
    this.isInvincible = false
    this.dashOnCooldown = false
    this.healOnCooldown = false
  }

  // === Persistence helpers ===

  _loadNumber(key, fallback) {
    try {
      const v = localStorage.getItem(key)
      return v === null ? fallback : Number(v)
    } catch (_) {
      return fallback
    }
  }

  _loadBool(key, fallback) {
    try {
      const v = localStorage.getItem(key)
      return v === null ? fallback : v === 'true'
    } catch (_) {
      return fallback
    }
  }

  _saveNumber(key, value) {
    try {
      localStorage.setItem(key, String(value))
    } catch (_) { /* localStorage unavailable */ }
  }

  _now() {
    return performance.now()
  }
}

// === Singleton export ===
export const state = new StateManager()
