import Phaser from 'phaser'
import { EnemyBase } from '../enemies/EnemyBase.js'

/**
 * CatKiki — the level 1 boss. A big orange cat.
 * Phases:
 *   - Phase 1 (100→50% HP): slow, sends claw waves every 2s
 *   - Phase 2 (50→0% HP): faster, flees toward couch
 */
export class CatKiki extends EnemyBase {
  constructor(scene, x, y, hp = 30) {
    super(scene, x, y, 'catKiki', hp)
    this.scoreValue = 1000
    this.damage = 1
    this.body.setSize(48, 40)
    this.moveDir = 1
    this.moveSpeed = 40
    this.moveTime = 0
    this.attackCooldown = 2000  // ms between attacks
    this.lastAttackAt = 0
    this.isBoss = true
  }

  update(time, delta) {
    if (!this.alive) return

    // Movement: simple side-to-side
    this.x += this.moveDir * this.moveSpeed * (delta / 1000)
    this.moveTime += delta

    if (this.moveTime > 1500) {
      this.moveTime = 0
      this.moveDir = -this.moveDir
    }

    // Attack
    if (time - this.lastAttackAt > this.attackCooldown) {
      this.lastAttackAt = time
      this._attack()
    }

    // Phase 2: faster movement
    if (this.hp <= this.maxHp / 2) {
      this.moveSpeed = 70
      this.attackCooldown = 1500
    }
  }

  _attack() {
    // Visual: flash + small shake
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 0.9,
      duration: 80,
      yoyo: true,
      repeat: 1,
    })
    // Damage to Christele if in range
    if (this.scene.christele && this.scene.christele.alive) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.christele.x, this.scene.christele.y)
      if (dist < 60) {
        this.scene.christele.takeDamage(this.damage)
      }
    }
  }
}
