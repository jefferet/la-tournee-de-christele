/**
 * music.js — Procedural chiptune background music loop.
 *
 * Shares the WebAudio context + master gain with sfx.js for unified
 * mute control. Three voices:
 *
 *   Channel 0 — Bass (triangle wave, low octave)
 *   Channel 1 — Lead melody (square wave, mid octave)
 *   Channel 2 — Kick drum (low sine pulse on each beat)
 *
 * Style: NES-era chiptune (Megaman / Castlevania vibes), A minor,
 * 110 BPM. Loop length ≈ 52 seconds. Designed to feel "heroic nurse
 * running between patients".
 *
 * Architecture:
 *   - Pattern is a static array of [tick, semitones, duration_ticks, channel]
 *   - Each loop iteration, all notes are scheduled ahead of time
 *   - Re-scheduled 500ms before loop end to avoid gaps
 *   - Music ducks (quieter) during game over dialog via setMusicVolume()
 */

import { getAudioContext, getMasterGain, isMuted } from './sfx.js'

const BPM = 110
const SIXTEENTH = 60 / BPM / 4  // seconds per 16th note

// Note frequencies (semitones from A4 = 440Hz, 12-tone equal temperament)
const N = {
  C2: -36, D2: -34, E2: -32, F2: -31, G2: -29, A2: -27, B2: -25,
  C3: -24, D3: -22, E3: -20, F3: -19, G3: -17, A3: -15, B3: -13,
  C4: -12, D4: -10, E4: -8,  F4: -7,  G4: -5,  A4: -3,  B4: -1,
  C5: 0,   D5: 2,   E5: 4,   F5: 6,   G5: 7,   A5: 9,   B5: 11,
  C6: 12,  D6: 14,
  REST: null,
}

// === PATTERN ===
// Loop = 4 phrases × 8 bars = 32 bars = 128 sixteenths = 2048 ticks/16
// Wait no: 1 bar = 16 sixteenths. So 32 bars = 512 sixteenths.
// At 110 BPM: 512 × (60/110/4) = 512 × 0.1364 = 69.8 seconds. Too long.
// Let me do 24 bars: 24 × 16 = 384 ticks → 384 × 0.1364 = 52.4 seconds. 
//
// Chord progression repeats every 4 bars: | Am | F | C | G |
// 24 bars = 6 repetitions of the 4-bar progression.

const PATTERN_LENGTH_TICKS = 384  // 24 bars

// Each entry: [tick, semitone, duration_ticks, channel]
// Channels: 0=bass, 1=lead, 2=kick
const PATTERN = [
  // ============ BASS LINE (one root per bar, 24 bars) ============
  // 6 × (Am F C G) progression. Bar numbers in comments for clarity.
  // Bar 1 (Am):  A2
  // Bar 2 (Am):  A2
  // Bar 3 (F):   F2
  // Bar 4 (F):   F2
  // Bar 5 (C):   C3
  // Bar 6 (C):   C3
  // Bar 7 (G):   G2
  // Bar 8 (G):   G2
  // ...repeats 6 times total (24 bars)
  [0,   N.A2, 16, 0],
  [16,  N.A2, 16, 0],
  [32,  N.F2, 16, 0],
  [48,  N.F2, 16, 0],
  [64,  N.C3, 16, 0],
  [80,  N.C3, 16, 0],
  [96,  N.G2, 16, 0],
  [112, N.G2, 16, 0],
  [128, N.A2, 16, 0],
  [144, N.A2, 16, 0],
  [160, N.F2, 16, 0],
  [176, N.F2, 16, 0],
  [192, N.C3, 16, 0],
  [208, N.C3, 16, 0],
  [224, N.G2, 16, 0],
  [240, N.G2, 16, 0],
  [256, N.A2, 16, 0],
  [272, N.A2, 16, 0],
  [288, N.F2, 16, 0],
  [304, N.F2, 16, 0],
  [320, N.C3, 16, 0],
  [336, N.C3, 16, 0],
  [352, N.G2, 16, 0],
  [368, N.G2, 16, 0],

  // ============ LEAD MELODY ============
  // Phrase 1 (Am, bars 1-2): ascending line, calmer
  [0,   N.E4, 4, 1],
  [4,   N.G4, 4, 1],
  [8,   N.A4, 4, 1],
  [12,  N.C5, 4, 1],
  [16,  N.B4, 4, 1],
  [20,  N.A4, 4, 1],
  [24,  N.G4, 4, 1],
  [28,  N.E4, 4, 1],

  // Phrase 2 (F, bars 3-4): a higher, more flowing line
  [32,  N.A4, 4, 1],
  [36,  N.C5, 4, 1],
  [40,  N.F5, 8, 1],
  [48,  N.E5, 4, 1],
  [52,  N.D5, 4, 1],
  [56,  N.C5, 8, 1],

  // Phrase 3 (C, bars 5-6): descending with a hop
  [64,  N.E5, 4, 1],
  [68,  N.D5, 4, 1],
  [72,  N.C5, 4, 1],
  [76,  N.B4, 4, 1],
  [80,  N.A4, 4, 1],
  [84,  N.G4, 4, 1],
  [88,  N.E4, 4, 1],
  [92,  N.G4, 4, 1],

  // Phrase 4 (G, bars 7-8): bright resolution up to A
  [96,  N.D5, 4, 1],
  [100, N.B4, 4, 1],
  [104, N.G4, 4, 1],
  [108, N.D5, 4, 1],
  [112, N.E5, 8, 1],
  [120, N.A4, 8, 1],

  // === SECOND ROUND (varied) ===

  // Phrase 5 (Am): different rhythm, syncopated
  [128, N.A4, 4, 1],
  [132, N.E4, 2, 1],
  [134, N.G4, 2, 1],
  [136, N.A4, 4, 1],
  [140, N.C5, 4, 1],
  [144, N.E5, 4, 1],
  [148, N.D5, 4, 1],
  [152, N.C5, 4, 1],
  [156, N.B4, 4, 1],
  [160, N.A4, 4, 1],

  // Phrase 6 (F): climax going up high
  [160, N.F5, 4, 1],
  [164, N.E5, 4, 1],
  [168, N.D5, 4, 1],
  [172, N.C5, 4, 1],
  [176, N.A4, 4, 1],
  [180, N.C5, 4, 1],
  [184, N.F5, 4, 1],
  [188, N.A5, 8, 1],

  // Phrase 7 (C): descending back down
  [192, N.G5, 4, 1],
  [196, N.E5, 4, 1],
  [200, N.D5, 4, 1],
  [204, N.C5, 4, 1],
  [208, N.B4, 4, 1],
  [212, N.A4, 4, 1],
  [216, N.G4, 4, 1],
  [220, N.E4, 4, 1],

  // Phrase 8 (G): resolve back to A
  [224, N.D5, 4, 1],
  [228, N.G4, 4, 1],
  [232, N.B4, 4, 1],
  [236, N.D5, 4, 1],
  [240, N.G5, 8, 1],
  [248, N.A4, 8, 1],

  // === THIRD ROUND (variation, more variation) ===

  // Phrase 9 (Am): quick 8th notes, busy
  [256, N.E4, 2, 1], [258, N.G4, 2, 1], [260, N.A4, 2, 1], [262, N.C5, 2, 1],
  [264, N.E5, 4, 1],
  [268, N.D5, 4, 1],
  [272, N.C5, 4, 1],
  [276, N.E5, 4, 1],
  [280, N.A4, 4, 1],
  [284, N.B4, 4, 1],

  // Phrase 10 (F): arpeggio feel
  [288, N.A4, 2, 1], [290, N.C5, 2, 1], [292, N.F5, 2, 1], [294, N.A5, 2, 1],
  [296, N.F5, 4, 1],
  [300, N.E5, 4, 1],
  [304, N.D5, 4, 1],
  [308, N.C5, 4, 1],
  [312, N.A4, 4, 1],
  [316, N.C5, 4, 1],

  // Phrase 11 (C): stately
  [320, N.E5, 4, 1],
  [324, N.G4, 4, 1],
  [328, N.E5, 4, 1],
  [332, N.G4, 4, 1],
  [336, N.C5, 8, 1],
  [344, N.E5, 8, 1],

  // Phrase 12 (G): wind down to A
  [352, N.D5, 4, 1],
  [356, N.B4, 4, 1],
  [360, N.G4, 4, 1],
  [364, N.D5, 4, 1],
  [368, N.A4, 8, 1],
  [376, N.E4, 8, 1],
]

// Build kick pattern: kick on beats 1 and 3 of every bar (24 bars)
const KICK_PATTERN = []
for (let bar = 0; bar < 24; bar++) {
  KICK_PATTERN.push([bar * 16 + 0,  N.A2, 1, 2])  // beat 1
  KICK_PATTERN.push([bar * 16 + 8,  N.A2, 1, 2])  // beat 3
}

const FULL_PATTERN = [...PATTERN, ...KICK_PATTERN]  

function _freq(semitones) {
  return 440 * Math.pow(2, semitones / 12)
}

function _scheduleNote(time, semitones, duration, channel) {
  const ctx = getAudioContext()
  const master = getMasterGain()
  if (!ctx || !master) return
  if (semitones === null) return  // rest

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  if (channel === 2) {
    // Kick: low sine pulse with quick pitch sweep
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.08)
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.40, time + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
  } else if (channel === 0) {
    // Bass: triangle, deep and round
    osc.type = 'triangle'
    osc.frequency.value = _freq(semitones)
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.18, time + 0.01)
    gain.gain.setValueAtTime(0.18, time + duration * SIXTEENTH * 0.4)
    gain.gain.linearRampToValueAtTime(0, time + duration * SIXTEENTH)
  } else {
    // Lead: square, brighter
    osc.type = 'square'
    osc.frequency.value = _freq(semitones)
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.10, time + 0.008)
    gain.gain.setValueAtTime(0.10, time + duration * SIXTEENTH * 0.5)
    gain.gain.linearRampToValueAtTime(0, time + duration * SIXTEENTH)
  }

  osc.connect(gain)
  gain.connect(master)
  osc.start(time)
  osc.stop(time + duration * SIXTEENTH + 0.05)
}

let _isPlaying = false
let _timeoutId = null
let _musicVolume = 1.0  // 0..1, for ducking during game over
let _pendingStart = false  // set true by startMusic() if AudioContext not ready yet

const _loopDurationSec = PATTERN_LENGTH_TICKS * SIXTEENTH  // ~52.4s

function _scheduleNextLoop() {
  if (!_isPlaying) return
  const ctx = getAudioContext()
  if (!ctx) return

  const startTime = ctx.currentTime + 0.05
  for (const [tick, semitones, duration, channel] of FULL_PATTERN) {
    _scheduleNote(startTime + tick * SIXTEENTH, semitones, duration, channel)
  }

  // Schedule the next loop iteration 200ms before the current one ends
  const delayMs = (_loopDurationSec - 0.2) * 1000
  _timeoutId = setTimeout(_scheduleNextLoop, delayMs)
}

export function startMusic() {
  if (_isPlaying) return
  if (!getAudioContext()) {
    // Audio not ready yet — queue start, will fire on 'mavis-audio-ready'
    _pendingStart = true
    console.log('[music] Audio not ready, queued')
    return
  }
  _pendingStart = false
  _isPlaying = true
  console.log('[music] Start (loop:', _loopDurationSec.toFixed(1), 's, notes:', FULL_PATTERN.length, ')')
  _scheduleNextLoop()
}

export function stopMusic() {
  if (!_isPlaying) return
  _isPlaying = false
  _pendingStart = false
  if (_timeoutId) {
    clearTimeout(_timeoutId)
    _timeoutId = null
  }
  console.log('[music] Stop')
}

export function isMusicPlaying() {
  return _isPlaying
}

/**
 * Duck the music volume (for game over dialog, etc.).
 * 1.0 = full volume, 0.3 = quiet background.
 */
export function setMusicVolume(vol) {
  _musicVolume = Math.max(0, Math.min(1, vol))
  // Future: route through per-channel gain nodes
}

// Auto-start when sfx.js finishes initializing the AudioContext.
// sfx.js dispatches 'mavis-audio-ready' on window when ready.
window.addEventListener('mavis-audio-ready', () => {
  if (_pendingStart) {
    console.log('[music] Audio ready, starting queued music')
    startMusic()
  }
})
