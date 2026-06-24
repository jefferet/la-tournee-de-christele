import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js'

/**
 * CarteVitale — falling health card. Collect for points.
 * Health cards are GOOD in this game (the administrative positive).
 */
export class CarteVitale extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y)
    this.scene = scene
    this.type = 'carteVitale'
    this.collected = false
    this.bobTime = 0
    this.fallSpeed = 70
    this.scoreValue = 100

    this.sprite = scene.add.sprite(0, 0, 'carteVitale', 0)
    this.add(this.sprite)
  }

  update(time, delta) {
    if (this.collected) return
    this.y += this.fallSpeed * (delta / 1000)
    this.bobTime += delta
    this.sprite.y = Math.sin(this.bobTime / 200) * 1.5
    if (this.y > GAME_HEIGHT + 32) {
      this.alive = false
      this.destroy()
    }
  }

  /**
   * Returns the AABB hitbox used for entity-vs-entity collision.
   * Matches the 18x14 sprite frame exactly.
   */
  getHitbox() {
    return {
      x: this.x - 9,
      y: this.y - 7,
      width: 18,
      height: 14,
    }
  }

  collect() {
    if (this.collected) return
    this.collected = true
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 250,
      onComplete: () => this.destroy(),
    })
  }

  destroy(fromScene) {
    if (this.scene && this.scene.activeCarteVitales) {
      const idx = this.scene.activeCarteVitales.indexOf(this)
      if (idx >= 0) this.scene.activeCarteVitales.splice(idx, 1)
    }
    super.destroy(fromScene)
  }
}
