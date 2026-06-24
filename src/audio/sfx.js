/**
 * sfx.js — Procédural 8-bit sound effects via WebAudio API.
 *
 * ROBUST INIT STRATEGY:
 *   1. AudioContext is created immediately on module load (in 'suspended' state)
 *   2. Global window listeners (pointerdown/keydown/touchstart) trigger
 *      resume() on the FIRST user interaction — this is the only moment
 *      Chrome/Safari allow audio to start.
 *   3. The event 'mavis-audio-ready' is dispatched when ctx.state === 'running'
 *   4. music.js listens for this event and auto-starts
 *
 * Style: NES / GameBoy era (square waves, short durations, fast attacks).
 *
 * Usage:
 *   import { sfx } from './sfx.js'
 *   sfx.play('shoot')              // play a sound
 *   sfx.setMuted(true)             // global mute
 *
 * Audio events:
 *   - shoot, dash, heal, hit, pickup, patientHeal, gameOver, menuSelect
 */

let _ctx = null
let _master = null
let _muted = false
let _resumed = false
let _initTried = false

/**
 * Initialize the AudioContext. Safe to call multiple times.
 * On first call (no user gesture), ctx will be in 'suspended' state.
 * The first user gesture triggers resume().
 */
function _initContext() {
  if (_ctx || _initTried) return
  _initTried = true
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) {
      console.warn('[sfx] WebAudio not supported in this browser')
      return
    }
    _ctx = new AC()
    _master = _ctx.createGain()
    _master.gain.value = _muted ? 0 : 0.6
    _master.connect(_ctx.destination)
    console.log('[sfx] AudioContext created, state:', _ctx.state)
  } catch (e) {
    console.warn('[sfx] AudioContext init failed:', e)
  }
}

/**
 * Try to resume the AudioContext. Must be called from a user gesture
 * handler to succeed in Chrome/Safari.
 */
function _tryResume() {
  if (!_ctx) _initContext()
  if (!_ctx) return
  if (_ctx.state === 'running') {
    if (!_resumed) {
      _resumed = true
      console.log('[sfx] AudioContext already running')
      window.dispatchEvent(new CustomEvent('mavis-audio-ready'))
    }
    return
  }
  _ctx.resume().then(() => {
    _resumed = true
    console.log('[sfx] AudioContext resumed, state:', _ctx.state)
    window.dispatchEvent(new CustomEvent('mavis-audio-ready'))
  }).catch(e => {
    console.warn('[sfx] resume failed:', e)
  })
}

// === Set up global user-gesture listeners IMMEDIATELY (module load) ===
// This runs on first import of sfx.js, which happens when PatientLevelScene
// or MenuScene is loaded. The listeners are attached to window/document,
// so they survive scene transitions.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const onGesture = () => {
    console.log('[sfx] User gesture detected')
    _tryResume()
  }
  // Use multiple event types to cover all input methods
  const events = ['pointerdown', 'mousedown', 'click', 'keydown', 'touchstart']
  events.forEach(ev => {
    document.addEventListener(ev, onGesture, { capture: true, passive: true })
  })
  console.log('[sfx] Global gesture listeners installed')
}

// Try to create ctx immediately (will be suspended until user gesture)
if (typeof window !== 'undefined') {
  // Wait one tick so we don't block initial render
  setTimeout(_initContext, 0)
}

/**
 * Hook into a Phaser scene to also listen for scene.input events.
 * This is in addition to the document-level listeners above (belt + suspenders).
 */
export function initAudioOnFirstGesture(scene) {
  if (!scene || !scene.input) return
  const onSceneInput = () => {
    console.log('[sfx] Phaser scene input gesture')
    _tryResume()
  }
  scene.input.once('pointerdown', onSceneInput)
  scene.input.keyboard.once('keydown', onSceneInput)
}

/**
 * Master mute toggle. Use with a HUD button.
 */
export function setMuted(muted) {
  _muted = !!muted
  if (_master) {
    _master.gain.value = _muted ? 0 : 0.6
  }
}
export function isMuted() {
  return _muted
}

/**
 * Expose the audio context for other audio modules (music.js) to share.
 * Returns null if audio hasn't been initialized yet.
 */
export function getAudioContext() {
  if (!_ctx) _initContext()
  return _ctx
}
export function getMasterGain() {
  if (!_ctx) _initContext()
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
    data[i] = (Math.random() * 2 - 1) * 0.5
  }

  const src = _ctx.createBufferSource()
  src.buffer = buffer

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

const NOTE = {
  C3: _noteFreq(-24), D3: _noteFreq(-22), E3: _noteFreq(-20), F3: _noteFreq(-19),
  G3: _noteFreq(-17), A3: _noteFreq(-15), B3: _noteFreq(-13),
  C4: _noteFreq(-12), D4: _noteFreq(-10), E4: _noteFreq(-8), F4: _noteFreq(-7),
  G4: _noteFreq(-5), A4: _noteFreq(-3), B4: _noteFreq(-1),
  C5: _noteFreq(0), D5: _noteFreq(2), E5: _noteFreq(4), F5: _noteFreq(6),
  G5: _noteFreq(7), A5: _noteFreq(9), B5: _noteFreq(11),
  C6: _noteFreq(12),
}

const _play = {
  shoot() {
    _osc('square', NOTE.C5, 0.12, {
      freqEnd: NOTE.G3, freqRamp: 0.10, peak: 0.3, sustainLevel: 0.05,
    })
  },
  dash() {
    _noise(0.18, { peak: 0.25, bandpass: true, bandpassFreq: 1500 })
    _osc('square', NOTE.E4, 0.08, {
      freqEnd: NOTE.A5, freqRamp: 0.08, peak: 0.15,
    })
  },
  heal() {
    _osc('square', NOTE.C4, 0.10, { peak: 0.3 })
    setTimeout(() => _osc('square', NOTE.E4, 0.10, { peak: 0.3 }), 80)
    setTimeout(() => _osc('square', NOTE.G4, 0.18, { peak: 0.3 }), 160)
  },
  hit() {
    _osc('square', NOTE.C3, 0.22, {
      freqEnd: NOTE.A2, freqRamp: 0.18, peak: 0.4, sustainLevel: 0.2,
    })
    _noise(0.15, { peak: 0.3, bandpass: true, bandpassFreq: 400 })
  },
  pickup() {
    _osc('square', NOTE.E5, 0.08, { peak: 0.25 })
    setTimeout(() => _osc('square', NOTE.A5, 0.12, { peak: 0.25 }), 70)
  },
  patientHeal() {
    _osc('square', NOTE.G4, 0.08, { peak: 0.28 })
    setTimeout(() => _osc('square', NOTE.B4, 0.08, { peak: 0.28 }), 70)
    setTimeout(() => _osc('square', NOTE.D5, 0.20, { peak: 0.28 }), 140)
  },
  gameOver() {
    _osc('square', NOTE.C5, 0.18, { peak: 0.32 })
    setTimeout(() => _osc('square', NOTE.A4, 0.18, { peak: 0.32 }), 200)
    setTimeout(() => _osc('square', NOTE.F4, 0.18, { peak: 0.32 }), 400)
    setTimeout(() => _osc('square', NOTE.C4, 0.45, { peak: 0.4 }), 600)
  },
  menuSelect() {
    _osc('square', NOTE.E5, 0.08, { peak: 0.25 })
  },
}

export const sfx = {
  play(name) {
    if (!_ctx) {
      _initContext()
      if (!_ctx) return
    }
    if (_ctx.state === 'suspended') _tryResume()
    if (_muted) return
    const fn = _play[name]
    if (fn) fn()
    else console.warn('[sfx] unknown sound:', name)
  },
  setMuted,
  isMuted,
  getAudioContext,
  getMasterGain,
}
