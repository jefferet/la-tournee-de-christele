import Phaser from 'phaser'

/**
 * KeyOr — combines multiple Phaser Key objects as a logical OR.
 * Useful for supporting both AZERTY (Z/Q/S/D) and QWERTY (W/A/S/D)
 * keyboard layouts simultaneously.
 *
 * Usage:
 *   this.keyUp = new KeyOr([
 *     scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
 *     scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
 *   ])
 *   if (this.keyUp.isDown) { ... }
 */
export class KeyOr {
  constructor(keys) {
    this.keys = keys
  }

  /** True if any of the underlying keys is currently down. */
  get isDown() {
    for (const k of this.keys) {
      if (k.isDown) return true
    }
    return false
  }

  /** True if any of the underlying keys was just pressed this frame. */
  wasJustPressed() {
    for (const k of this.keys) {
      if (Phaser.Input.Keyboard.JustDown(k)) return true
    }
    return false
  }
}
