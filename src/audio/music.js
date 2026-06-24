/**
 * music.js — Background music player.
 *
 * Supports two track kinds:
 *   - 'mp3'      : file loaded via fetch + decodeAudioData, looped
 *   - 'procedural': synthesized via WebAudio oscillators (see original
 *                   chiptune implementation)
 *
 * Track registry:
 *   - 'venus'    : MP3 file (SketchyLogic, NES Shooter Music, CC0)
 *   - 'chiptune' : procedural chiptune (no asset)
 *
 * Architecture:
 *   - getAudioContext() and getMasterGain() are shared with sfx.js
 *   - 'mavis-audio-ready' event triggers queued startMusic()
 *   - setTrack(id) switches current track (stops, preloads, restarts)
 *   - Track choice persists in localStorage 'christele-track'
 *
 * Usage:
 *   import { startMusic, setTrack, getCurrentTrack } from './music.js'
 *   setTrack('venus')      // switch to Venus MP3
 *   startMusic()           // start playing current track
 */

import { getAudioContext, getMasterGain, isMuted } from './sfx.js'

// === Track registry ===
const TRACKS = {
  venus: {
    name: 'Venus',
    shortLabel: 'V',
    kind: 'mp3',
    url: '/audio/music/venus.mp3',
  },
  chiptune: {
    name: 'Chiptune procédural',
    shortLabel: '♪',
    kind: 'procedural',
  },
}

// === State ===
let _currentTrackId = 'venus'  // default after Jef added Venus MP3
let _currentBuffer = null      // AudioBuffer for MP3 tracks
let _currentSource = null      // AudioBufferSourceNode or null
let _isPlaying = false
let _pendingStart = false
let _loopTimeoutId = null      // for procedural track scheduling

// === Persisted track choice ===
try {
  const saved = localStorage.getItem('christele-track')
  if (saved && TRACKS[saved]) _currentTrackId = saved
} catch (_) {}

// === Procedural chiptune pattern (La mineur, 110 BPM, 24 bars) ===
const BPM = 110
const SIXTEENTH = 60 / BPM / 4

const N = {
  C2: -36, D2: -34, E2: -32, F2: -31, G2: -29, A2: -27, B2: -25,
  C3: -24, D3: -22, E3: -20, F3: -19, G3: -17, A3: -15, B3: -13,
  C4: -12, D4: -10, E4: -8,  F4: -7,  G4: -5,  A4: -3,  B4: -1,
  C5: 0,   D5: 2,   E5: 4,   F5: 6,   G5: 7,   A5: 9,   B5: 11,
  C6: 12,  D6: 14,
  REST: null,
}

const PATTERN_LENGTH_TICKS = 384

const PATTERN = [
  // Bass
  [0,   N.A2, 16, 0], [16,  N.A2, 16, 0], [32,  N.F2, 16, 0], [48,  N.F2, 16, 0],
  [64,  N.C3, 16, 0], [80,  N.C3, 16, 0], [96,  N.G2, 16, 0], [112, N.G2, 16, 0],
  [128, N.A2, 16, 0], [144, N.A2, 16, 0], [160, N.F2, 16, 0], [176, N.F2, 16, 0],
  [192, N.C3, 16, 0], [208, N.C3, 16, 0], [224, N.G2, 16, 0], [240, N.G2, 16, 0],
  [256, N.A2, 16, 0], [272, N.A2, 16, 0], [288, N.F2, 16, 0], [304, N.F2, 16, 0],
  [320, N.C3, 16, 0], [336, N.C3, 16, 0], [352, N.G2, 16, 0], [368, N.G2, 16, 0],
  // Lead
  [0, N.E4, 4, 1], [4, N.G4, 4, 1], [8, N.A4, 4, 1], [12, N.C5, 4, 1],
  [16, N.B4, 4, 1], [20, N.A4, 4, 1], [24, N.G4, 4, 1], [28, N.E4, 4, 1],
  [32, N.A4, 4, 1], [36, N.C5, 4, 1], [40, N.F5, 8, 1], [48, N.E5, 4, 1],
  [52, N.D5, 4, 1], [56, N.C5, 8, 1],
  [64, N.E5, 4, 1], [68, N.D5, 4, 1], [72, N.C5, 4, 1], [76, N.B4, 4, 1],
  [80, N.A4, 4, 1], [84, N.G4, 4, 1], [88, N.E4, 4, 1], [92, N.G4, 4, 1],
  [96, N.D5, 4, 1], [100, N.B4, 4, 1], [104, N.G4, 4, 1], [108, N.D5, 4, 1],
  [112, N.E5, 8, 1], [120, N.A4, 8, 1],
  [128, N.A4, 4, 1], [132, N.E4, 2, 1], [134, N.G4, 2, 1], [136, N.A4, 4, 1],
  [140, N.C5, 4, 1], [144, N.E5, 4, 1], [148, N.D5, 4, 1], [152, N.C5, 4, 1],
  [156, N.B4, 4, 1], [160, N.A4, 4, 1],
  [160, N.F5, 4, 1], [164, N.E5, 4, 1], [168, N.D5, 4, 1], [172, N.C5, 4, 1],
  [176, N.A4, 4, 1], [180, N.C5, 4, 1], [184, N.F5, 4, 1], [188, N.A5, 8, 1],
  [192, N.G5, 4, 1], [196, N.E5, 4, 1], [200, N.D5, 4, 1], [204, N.C5, 4, 1],
  [208, N.B4, 4, 1], [212, N.A4, 4, 1], [216, N.G4, 4, 1], [220, N.E4, 4, 1],
  [224, N.D5, 4, 1], [228, N.G4, 4, 1], [232, N.B4, 4, 1], [236, N.D5, 4, 1],
  [240, N.G5, 8, 1], [248, N.A4, 8, 1],
  [256, N.E4, 2, 1], [258, N.G4, 2, 1], [260, N.A4, 2, 1], [262, N.C5, 2, 1],
  [264, N.E5, 4, 1], [268, N.D5, 4, 1], [272, N.C5, 4, 1], [276, N.E5, 4, 1],
  [280, N.A4, 4, 1], [284, N.B4, 4, 1],
  [288, N.A4, 2, 1], [290, N.C5, 2, 1], [292, N.F5, 2, 1], [294, N.A5, 2, 1],
  [296, N.F5, 4, 1], [300, N.E5, 4, 1], [304, N.D5, 4, 1], [308, N.C5, 4, 1],
  [312, N.A4, 4, 1], [316, N.C5, 4, 1],
  [320, N.E5, 4, 1], [324, N.G4, 4, 1], [328, N.E5, 4, 1], [332, N.G4, 4, 1],
  [336, N.C5, 8, 1], [344, N.E5, 8, 1],
  [352, N.D5, 4, 1], [356, N.B4, 4, 1], [360, N.G4, 4, 1], [364, N.D5, 4, 1],
  [368, N.A4, 8, 1], [376, N.E4, 8, 1],
]

const KICK_PATTERN = []
for (let bar = 0; bar < 24; bar++) {
  KICK_PATTERN.push([bar * 16 + 0,  N.A2, 1, 2])
  KICK_PATTERN.push([bar * 16 + 8,  N.A2, 1, 2])
}

const FULL_PATTERN = [...PATTERN, ...KICK_PATTERN]

// === Audio helpers ===
function _freq(semitones) {
  return 440 * Math.pow(2, semitones / 12)
}

function _scheduleNote(ctx, master, time, semitones, duration, channel) {
  if (semitones === null) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  if (channel === 2) {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.08)
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.40, time + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
  } else if (channel === 0) {
    osc.type = 'triangle'
    osc.frequency.value = _freq(semitones)
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.18, time + 0.01)
    gain.gain.setValueAtTime(0.18, time + duration * SIXTEENTH * 0.4)
    gain.gain.linearRampToValueAtTime(0, time + duration * SIXTEENTH)
  } else {
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

const _loopDurationSec = PATTERN_LENGTH_TICKS * SIXTEENTH

function _scheduleNextLoop(ctx, master) {
  if (!_isPlaying) return
  const startTime = ctx.currentTime + 0.05
  for (const [tick, semitones, duration, channel] of FULL_PATTERN) {
    _scheduleNote(ctx, master, startTime + tick * SIXTEENTH, semitones, duration, channel)
  }
  _loopTimeoutId = setTimeout(() => _scheduleNextLoop(ctx, master), (_loopDurationSec - 0.2) * 1000)
}

// === MP3 loading ===
async function _loadMp3(url) {
  const ctx = getAudioContext()
  if (!ctx) throw new Error('AudioContext not ready')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`)
  const arrayBuffer = await response.arrayBuffer()
  return await ctx.decodeAudioData(arrayBuffer)
}

// === Public API ===

/**
 * Get the current track ID.
 */
export function getCurrentTrack() {
  return _currentTrackId
}

/**
 * Get list of available tracks for UI iteration.
 */
export function getAvailableTracks() {
  return Object.entries(TRACKS).map(([id, t]) => ({ id, ...t }))
}

/**
 * Switch to a different track. Stops current playback, loads new track,
 * optionally restarts playback if it was playing. Persists choice.
 */
export async function setTrack(trackId) {
  if (!TRACKS[trackId]) {
    console.warn('[music] unknown track:', trackId)
    return
  }
  const wasPlaying = _isPlaying
  stopMusic()
  _currentTrackId = trackId
  _currentBuffer = null
  try { localStorage.setItem('christele-track', trackId) } catch (_) {}
  console.log('[music] Track →', trackId)
  if (wasPlaying) await startMusic()
}

/**
 * Cycle to the next track (helper for the HUD button).
 */
export async function cycleTrack() {
  const ids = Object.keys(TRACKS)
  const idx = ids.indexOf(_currentTrackId)
  const next = ids[(idx + 1) % ids.length]
  await setTrack(next)
  return next
}

/**
 * Start playing the current track. No-op if already playing.
 * If audio isn't ready yet, queues start (auto-fires on 'mavis-audio-ready').
 */
export async function startMusic() {
  if (_isPlaying) return
  const ctx = getAudioContext()
  if (!ctx) {
    _pendingStart = true
    console.log('[music] Audio not ready, queued')
    return
  }
  const master = getMasterGain()
  if (!master) return

  const track = TRACKS[_currentTrackId]
  if (!track) return

  _pendingStart = false

  if (track.kind === 'mp3') {
    try {
      if (!_currentBuffer) {
        console.log('[music] Loading MP3:', track.url)
        _currentBuffer = await _loadMp3(track.url)
      }
      const src = ctx.createBufferSource()
      src.buffer = _currentBuffer
      src.loop = true
      src.connect(master)
      src.start()
      _currentSource = src
      _isPlaying = true
      console.log('[music] Started', _currentTrackId, 'MP3, looping (',
        _currentBuffer.duration.toFixed(1), 's)')
    } catch (e) {
      console.warn('[music] Failed to start MP3 track:', e)
    }
  } else {
    // Procedural chiptune
    _isPlaying = true
    console.log('[music] Started procedural chiptune, loop:',
      _loopDurationSec.toFixed(1), 's')
    _scheduleNextLoop(ctx, master)
  }
}

/**
 * Stop playback. Safe to call when not playing.
 */
export function stopMusic() {
  if (!_isPlaying && !_pendingStart) return
  _isPlaying = false
  _pendingStart = false
  if (_currentSource) {
    try { _currentSource.stop() } catch (_) {}
    _currentSource = null
  }
  if (_loopTimeoutId) {
    clearTimeout(_loopTimeoutId)
    _loopTimeoutId = null
  }
}

export function isMusicPlaying() {
  return _isPlaying
}

// Auto-start when sfx.js finishes initializing the AudioContext.
window.addEventListener('mavis-audio-ready', () => {
  if (_pendingStart) {
    console.log('[music] Audio ready, starting queued music')
    startMusic()
  }
})
