import Phaser from 'phaser'
import { ENEMY_DEFAULTS } from '../../config/constants.js'

/**
 * EnemyBase — abstract base class for all enemies.
 * Handles HP, damage, score, death animation.
 */
export class EnemyBase extends Phaser.GameObjects.Container {
  constructor(scene, x, y, texture, hp) {
    super(scene, x, y)
    this.scene = scene
    this.hp = hp || 1
    this.maxHp = hp || 1
    this.damage = ENEMY_DEFAULTS.CONTACT_DAMAGE
    this.scoreValue = ENEMY_DEFAULTS.POINTS
    this.alive = true
    this.invulnerable = false
    this.flashing = false

    // Add a default body
    this.bodySprite = scene.add.sprite(0, 0, texture, 0)
    this.add(this.bodySprite)

    scene.physics.add.existing(this)
    this.body.setCollideWorldBounds(true)
  }

  takeDamage(amount) {
    if (!this.alive || this.invulnerable) return false
    this.hp -= amount
    this.flashing = true
    // Flash effect
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
    // Award score
    if (this.scene.state) {
      this.scene.state.addScore(this.scoreValue)
    }
    // Death animation: scale down + fade
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
    // Override in subclasses
  }

  destroy(fromScene) {
    if (this.scene && this.scene.activeEnemies) {
      const idx = this.scene.activeEnemies.indexOf(this)
      if (idx >= 0) this.scene.activeEnemies.splice(idx, 1)
    }
    super.destroy(fromScene)
  }
}
