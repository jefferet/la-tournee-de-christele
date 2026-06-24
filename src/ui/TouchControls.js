import Phaser from 'phaser'

// === Tunable constants ===
const DPAD_BUTTON_RADIUS = 18    // D-pad individual button radius
const DPAD_BUTTON_GAP = 4        // visual gap between D-pad buttons
const FIRE_BUTTON_RADIUS = 32    // fire button radius

/**
 * TouchControls — LANDSCAPE / MINIMAL layout.
 *
 * Layout (landscape phone/tablet, game is 480x270):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │                                              │
 *   │              ZONE DE JEU                     │
 *   │                                              │
 *   │   ╭─╮                                        │
 *   │   │↑│                                        │
 *   │ ╭─╮╭─╮╮                              ╭───╮  │
 *   │ │←││→││                               │💉│  │
 *   │ ╰─╯╰─╯╰                              ╰───╯  │
 *   │   │↓│         ← D-pad 4 directions         │
 *   │   ╰─╯                                        │
 *   └──────────────────────────────────────────────┘
 *
 * Maps touch to Christele's existing inputState.
 *   - D-pad → inputState.{up,down,left,right}
 *   - Fire button → inputState.fire + inputState.fireJustPressed
 *
 * No Dash / Heal buttons (kept minimal per user request).
 */
export class TouchControls extends Phaser.GameObjects.Container {
  constructor(scene, christele) {
    super(scene, 0, 0)
    this.scene = scene
    this.christele = christele

    const W = scene.cameras.main.width
    const H = scene.cameras.main.height

    // === D-pad (bottom-left) ===
    // Center at (60, H - 50) so the whole + fits in the bottom-left corner
    const cx = 60
    const cy = H - 50

    // Up
    this.dpadUp = this._makeDpadButton(cx, cy - (DPAD_BUTTON_RADIUS * 2 + DPAD_BUTTON_GAP), '↑')
    // Down
    this.dpadDown = this._makeDpadButton(cx, cy + (DPAD_BUTTON_RADIUS * 2 + DPAD_BUTTON_GAP), '↓')
    // Left
    this.dpadLeft = this._makeDpadButton(cx - (DPAD_BUTTON_RADIUS * 2 + DPAD_BUTTON_GAP), cy, '←')
    // Right
    this.dpadRight = this._makeDpadButton(cx + (DPAD_BUTTON_RADIUS * 2 + DPAD_BUTTON_GAP), cy, '→')

    // === Fire button (bottom-right) ===
    this.fireBtn = scene.add.circle(W - 60, H - 50, FIRE_BUTTON_RADIUS, 0xc0392b, 0.5)
    this.fireBtn.setStrokeStyle(2, 0xffffff, 0.6)
    this.fireBtn.setInteractive({ useHandCursor: false })
    this.fireBtn.on('pointerdown', () => this._onFireDown())
    this.fireBtn.on('pointerup', () => this._onFireUp())
    this.fireBtn.on('pointerout', () => this._onFireUp())
    this.add(this.fireBtn)

    this.fireLabel = scene.add.text(W - 60, H - 50, '💉', {
      fontSize: '22px',
    }).setOrigin(0.5)
    this.add(this.fireLabel)

    // High depth so touch UI is on top of game elements
    this.setDepth(9000)
  }

  /**
   * Creates one D-pad button (visual circle + label + handler wiring).
   * `dir` is 'up'|'down'|'left'|'right'.
   */
  _makeDpadButton(x, y, glyph) {
    const btn = this.scene.add.circle(x, y, DPAD_BUTTON_RADIUS, 0x2c3e50, 0.45)
    btn.setStrokeStyle(2, 0xffffff, 0.6)
    btn.setInteractive({ useHandCursor: false })

    const label = this.scene.add.text(x, y, glyph, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Determine direction from glyph
    const dir =
      glyph === '↑' ? 'up' :
      glyph === '↓' ? 'down' :
      glyph === '←' ? 'left' :
      'right'

    btn.on('pointerdown', () => this._onDpadDown(dir))
    btn.on('pointerup', () => this._onDpadUp(dir))
    btn.on('pointerout', () => this._onDpadUp(dir))

    this.add(btn)
    this.add(label)
    return btn
  }

  // === D-pad handlers ===

  _onDpadDown(dir) {
    this.christele.inputState[dir] = true
    // Visual feedback: slightly brighter on press
    const btn = this[`dpad${dir.charAt(0).toUpperCase() + dir.slice(1)}`]
    if (btn) btn.setFillStyle(0x34495e, 0.7)
  }

  _onDpadUp(dir) {
    this.christele.inputState[dir] = false
    const btn = this[`dpad${dir.charAt(0).toUpperCase() + dir.slice(1)}`]
    if (btn) btn.setFillStyle(0x2c3e50, 0.45)
  }

  // === Fire button handlers ===

  _onFireDown() {
    this.christele.inputState.fire = true
    this.christele.inputState.fireJustPressed = true
    this.fireBtn.setFillStyle(0xe74c3c, 0.7)
  }

  _onFireUp() {
    this.christele.inputState.fire = false
    this.fireBtn.setFillStyle(0xc0392b, 0.5)
  }
}
