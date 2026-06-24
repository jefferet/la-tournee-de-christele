import Phaser from 'phaser'
import { GAME_WIDTH, COLORS } from '../config/constants.js'

/**
 * VolumeSlider — a draggable horizontal volume slider.
 *
 * Pure Phaser (no DOM). Track + knob + invisible hit area for touch.
 * Persists value to localStorage so it survives reloads.
 *
 * Visual layout:
 *
 *   ┌─────────────────────────────┐
 *   │   ━━━━━●━━━━━━━━━━━━━━━━    │  ← slider
 *   └─────────────────────────────┘
 *
 * Usage:
 *   const slider = new VolumeSlider(scene, x, y, width)
 *   scene.add.existing(slider)
 *   slider.on('change', value => updateMasterVolume(value))
 */
export class VolumeSlider extends Phaser.GameObjects.Container {
  static STORAGE_KEY = 'christele-volume'

  constructor(scene, x, y, width = 60) {
    super(scene, x, y)
    this.scene = scene
    this.width = width
    this.value = this._loadStored()

    // === Visual ===
    this.trackBg = scene.add.rectangle(0, 0, width, 6, 0x222222, 0.85)
      .setOrigin(0, 0.5)
    this.trackFill = scene.add.rectangle(0, 0, width * this.value, 6, 0x2ecc71, 1)
      .setOrigin(0, 0.5)
    this.knob = scene.add.circle(width * this.value, 0, 5, 0xffffff, 1)
      .setStrokeStyle(1, 0x2ecc71)

    this.add([this.trackBg, this.trackFill, this.knob])

    // === Invisible larger hit area (for touch) ===
    this.hitArea = scene.add.rectangle(0, 0, width, 20, 0x000000, 0)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true, draggable: false })
    this.add(this.hitArea)

    // === Drag state ===
    this._dragging = false
    this._setupInputs()
  }

  _loadStored() {
    try {
      const v = parseFloat(localStorage.getItem(VolumeSlider.STORAGE_KEY))
      if (!isNaN(v) && v >= 0 && v <= 1) return v
    } catch (_) {}
    return 0.4  // Default 40% — was 50%, lowered because music was too loud
  }

  _saveStored() {
    try {
      localStorage.setItem(VolumeSlider.STORAGE_KEY, String(this.value))
    } catch (_) {}
  }

  _setupInputs() {
    // Pointerdown: jump to that position OR start drag if on knob
    this.hitArea.on('pointerdown', (pointer) => {
      this._dragging = true
      this._updateFromPointer(pointer)
      // Capture pointer so we keep getting moves outside the hit area
      this.scene.input.setDefaultCursor('grabbing')
    })

    this.scene.input.on('pointermove', (pointer) => {
      if (!this._dragging) return
      this._updateFromPointer(pointer)
    })

    this.scene.input.on('pointerup', () => {
      if (this._dragging) {
        this._dragging = false
        this.scene.input.setDefaultCursor('default')
      }
    })
  }

  _updateFromPointer(pointer) {
    // pointer.x is world coords; subtract our container x to get local x
    const localX = pointer.x - this.x
    const clamped = Math.max(0, Math.min(this.width, localX))
    const newValue = clamped / this.width
    if (Math.abs(newValue - this.value) > 0.001) {
      this.value = newValue
      this._refresh()
      this._saveStored()
      this.emit('change', this.value)
    }
  }

  _refresh() {
    this.trackFill.width = this.width * this.value
    this.knob.x = this.width * this.value
    // Color knob based on volume
    if (this.value < 0.05) {
      this.knob.setStrokeStyle(1, 0x666666)
      this.trackFill.fillColor = 0x666666
    } else if (this.value < 0.5) {
      this.knob.setStrokeStyle(1, 0xf1c40f)
      this.trackFill.fillColor = 0xf1c40f
    } else {
      this.knob.setStrokeStyle(1, 0x2ecc71)
      this.trackFill.fillColor = 0x2ecc71
    }
  }

  /**
   * Set the value programmatically (e.g., from localStorage on load).
   * Does NOT emit 'change' to avoid feedback loops.
   */
  setValue(v, silent = true) {
    this.value = Math.max(0, Math.min(1, v))
    this._refresh()
    if (!silent) {
      this.emit('change', this.value)
    }
  }
}
