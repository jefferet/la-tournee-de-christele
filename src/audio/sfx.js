/**
 * sfx.js — Procédural 8-bit sound effects via WebAudio API.
 *
 * No external assets — every sound is synthesized at runtime using
 * OscillatorNode (square / triangle) and BufferSource (noise) + GainNode
 * envelopes. This keeps the bundle tiny and the game offline-capable (PWA).
 *
 * Style: NES / GameBoy era (square waves, short durations, fast attacks).
 *
 * Usage:
 *   import { sfx, initAudioOnFirstGesture } from './sfx.js'
 *   initAudioOnFirstGesture()      // call once on game start
 *   sfx.play('shoot')              // play a sound
 *   sfx.muted = true               // global mute
 *
 * Audio events:
 *   - shoot         : pew descending square wave
 *   - dash          : whoosh rising noise burst
 *   - heal          : ascending 3-note arpeggio
 *   - hit           : low downward noise burst (took damage)
 *   - pickup        : 2-note ascending ding (CV collect)
 *   - patientHeal   : 3-note happy chime (patient healed)
 *   - gameOver      : 4-note descending sad melody
 *   - menuSelect    : single beep
 */

let _ctx = null
let _master = null
let _muted = false

/**
 * Lazily create the AudioContext on the first user gesture.
 * Chrome/Safari require user interaction before audio can play.
 * Call this from scene.create() — it hooks Phaser's first input event.
 */
export function initAudioOnFirstGesture(scene) {
  const tryInit = () => {
    if (_ctx) return
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) {
        console.warn('[sfx] WebAudio not supported')
        return
      }
      _ctx = new AC()
      _master = _ctx.createGain()
      _master.gain.value = _muted ? 0 : 0.6
      _master.connect(_ctx.destination)
      console.log('[sfx] AudioContext ready')
    } catch (e) {
      console.warn('[sfx] AudioContext init failed:', e)
    }
  }

  // Phaser emits a 'pointerdown' or 'keydown' on first user interaction.
  // We hook both to be safe (covers touch + keyboard).
  const onFirst = () => {
    tryInit()
    if (_ctx && _ctx.state === 'suspended') {
      _ctx.resume().catch(() => {})
    }
  }

  if (scene && scene.input) {
    scene.input.once('pointerdown', onFirst)
    scene.input.keyboard.once('keydown', onFirst)
  }
  // Also try on any document-level click (covers PWA edge cases)
  document.addEventListener('pointerdown', onFirst, { once: true })
}

/**
 * Master mute toggle. Use with a HUD button.
 */
export function setMuted(muted) {
  _muted = !!muted
  if (_master) _master.gain.value = _muted ? 0 : 0.6
}
export function isMuted() {
  return _muted
}

/**
 * Expose the audio context for other audio modules (music.js) to share.
 * Returns null if audio hasn't been initialized yet.
 */
export function getAudioContext() {
  return _ctx
}
export function getMasterGain() {
  return _master
}

/**
 * Core helpers (low-level WebAudio primitives)
 */
function _osc(type, freq, duration, opts = {}) {
  if (!_ctx || !_master) return
  const t0 = _ctx.currentTime
  const osc = _ctx.createOscillator()
  const gain = _ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(opts.freqStart ?? freq, t0)
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(0.001, opts.freqEnd),
      t0 + (opts.freqRamp ?? duration)
    )
  }

  // Envelope: attack 5ms, decay to opts.sustainLevel, release to 0
  const peak = opts.peak ?? 0.6
  const sustainLevel = opts.sustainLevel ?? 0.3
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.005)
  gain.gain.linearRampToValueAtTime(sustainLevel, t0 + 0.05)
  gain.gain.setValueAtTime(sustainLevel, t0 + Math.max(0.05, duration - 0.04))
  gain.gain.linearRampToValueAtTime(0, t0 + duration)

  osc.connect(gain)
  gain.connect(_master)

  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

function _noise(duration, opts = {}) {
  if (!_ctx || !_master) return
  const t0 = _ctx.currentTime
  const bufferSize = Math.floor(_ctx.sampleRate * duration)
  const buffer = _ctx.createBuffer(1, bufferSize, _ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    // Soft noise (less harsh than pure white)
    data[i] = (Math.random() * 2 - 1) * 0.5
  }

  const src = _ctx.createBufferSource()
  src.buffer = buffer

  // Optional bandpass for a less hissy noise
  let last = src
  if (opts.bandpass) {
    const bp = _ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = opts.bandpassFreq ?? 1000
    bp.Q.value = 1.5
    src.connect(bp)
    last = bp
  }

  const gain = _ctx.createGain()
  const peak = opts.peak ?? 0.5
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.005)
  gain.gain.linearRampToValueAtTime(0, t0 + duration)

  last.connect(gain)
  gain.connect(_master)
  src.start(t0)
  src.stop(t0 + duration + 0.05)
}

/**
 * Note helpers — A4 = 440Hz, 12-tone equal temperament
 */
function _noteFreq(semitonesFromA4) {
  return 440 * Math.pow(2, semitonesFromA4 / 12)
}

// Convenient named frequencies (NES-style A major scale)
const NOTE = {
  C3: _noteFreq(-24), D3: _noteFreq(-22), E3: _noteFreq(-20), F3: _noteFreq(-19),
  G3: _noteFreq(-17), A3: _noteFreq(-15), B3: _noteFreq(-13),
  C4: _noteFreq(-12), D4: _noteFreq(-10), E4: _noteFreq(-8), F4: _noteFreq(-7),
  G4: _noteFreq(-5), A4: _noteFreq(-3), B4: _noteFreq(-1),
  C5: _noteFreq(0), D5: _noteFreq(2), E5: _noteFreq(4), F5: _noteFreq(6),
  G5: _noteFreq(7), A5: _noteFreq(9), B5: _noteFreq(11),
  C6: _noteFreq(12),
}

/**
 * High-level SFX — each function is a single discrete event.
 * Designed to be cheap (one oscillator at a time, < 500ms).
 */
const _play = {
  /** Pew descending square wave — syringe shot */
  shoot() {
    _osc('square', NOTE.C5, 0.12, {
      freqEnd: NOTE.G3,
      freqRamp: 0.10,
      peak: 0.3,
      sustainLevel: 0.05,
    })
  },

  /** Whoosh — dash (rising noise burst, bandpassed) */
  dash() {
    _noise(0.18, { peak: 0.25, bandpass: true, bandpassFreq: 1500 })
    // Subtle high tone sweep for snap
    _osc('square', NOTE.E4, 0.08, {
      freqEnd: NOTE.A5,
      freqRamp: 0.08,
      peak: 0.15,
    })
  },

  /** Ascending 3-note arpeggio (C-E-G) — heal */
  heal() {
    _osc('square', NOTE.C4, 0.10, { peak: 0.3 })
    setTimeout(() => _osc('square', NOTE.E4, 0.10, { peak: 0.3 }), 80)
    setTimeout(() => _osc('square', NOTE.G4, 0.18, { peak: 0.3 }), 160)
  },

  /** Low noise burst with downward pitch — taking damage */
  hit() {
    _osc('square', NOTE.C3, 0.22, {
      freqEnd: NOTE.A2,
      freqRamp: 0.18,
      peak: 0.4,
      sustainLevel: 0.2,
    })
    _noise(0.15, { peak: 0.3, bandpass: true, bandpassFreq: 400 })
  },

  /** 2-note ascending ding — Carte Vitale collected */
  pickup() {
    _osc('square', NOTE.E5, 0.08, { peak: 0.25 })
    setTimeout(() => _osc('square', NOTE.A5, 0.12, { peak: 0.25 }), 70)
  },

  /** 3-note happy chime — patient healed */
  patientHeal() {
    _osc('square', NOTE.G4, 0.08, { peak: 0.28 })
    setTimeout(() => _osc('square', NOTE.B4, 0.08, { peak: 0.28 }), 70)
    setTimeout(() => _osc('square', NOTE.D5, 0.20, { peak: 0.28 }), 140)
  },

  /** 4-note descending sad melody — game over */
  gameOver() {
    _osc('square', NOTE.C5, 0.18, { peak: 0.32 })
    setTimeout(() => _osc('square', NOTE.A4, 0.18, { peak: 0.32 }), 200)
    setTimeout(() => _osc('square', NOTE.F4, 0.18, { peak: 0.32 }), 400)
    setTimeout(() => _osc('square', NOTE.C4, 0.45, { peak: 0.4 }), 600)
  },

  /** Single beep — menu select */
  menuSelect() {
    _osc('square', NOTE.E5, 0.08, { peak: 0.25 })
  },
}

export const sfx = {
  play(name) {
    if (!_ctx) return  // AudioContext not yet initialized
    if (_muted) return
    const fn = _play[name]
    if (fn) fn()
    else console.warn('[sfx] unknown sound:', name)
  },
  setMuted,
  isMuted,
}
