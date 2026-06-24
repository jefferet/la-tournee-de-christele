import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js'

/**
 * Patient — a sick person walking across the screen.
 * Christele must shoot them with a syringe to "care" them.
 * Reward: 10 points per patient healed.
 */
export class Patient extends Phaser.GameObjects.Container {
  constructor(scene, x, y, direction = 1) {
    super(scene, x, y)
    this.scene = scene
    this.hp = 1
    this.maxHp = 1
    this.damage = 0  // Patients are harmless
    this.scoreValue = 50
    this.alive = true
    this.invulnerable = false
    this.flashing = false

    this.bodySprite = scene.add.sprite(0, 0, 'patient', 0)
    this.add(this.bodySprite)

    this.moveDir = direction
    this.moveSpeed = 35
    // Flip sprite if walking left (container has no setFlipX, must use child)
    if (direction < 0 && this.bodySprite) this.bodySprite.setFlipX(true)
  }

  /**
   * Returns the AABB hitbox used for entity-vs-entity collision.
   * Matches the 16x24 sprite frame exactly.
   */
  getHitbox() {
    return {
      x: this.x - 8,
      y: this.y - 12,
      width: 16,
      height: 24,
    }
  }

  takeDamage(amount) {
    if (!this.alive || this.invulnerable) return false
    this.hp -= amount
    this.flashing = true
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 60,
      yoyo: true,
      repeat: 1,
      onComplete: () => { this.flashing = false; this.setAlpha(1) },
    })
    if (this.hp <= 0) {
      this.die()
      return true
    }
    return false
  }

  die() {
    this.alive = false
    if (this.scene.state) {
      this.scene.state.addScore(this.scoreValue)
    }
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    })
  }

  update(time, delta) {
    if (!this.alive) return
    this.x += this.moveDir * this.moveSpeed * (delta / 1000)
    if (this.x < -32 || this.x > GAME_WIDTH + 32) {
      this.alive = false
      this.destroy()
    }
  }

  destroy(fromScene) {
    if (this.scene && this.scene.patients) {
      const idx = this.scene.patients.indexOf(this)
      if (idx >= 0) this.scene.patients.splice(idx, 1)
    }
    super.destroy(fromScene)
  }
}
