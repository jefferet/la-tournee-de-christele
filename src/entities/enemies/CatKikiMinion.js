import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, CHRISTELE } from '../../config/constants.js'
import { EnemyBase } from './EnemyBase.js'

/**
 * CatKikiMinion — the only enemy in the mini-game.
 * Two modes:
 *   - falling (default for endless): drops from top, moves down
 *   - walking (legacy): bounces left/right
 */
export class CatKikiMinion extends EnemyBase {
  constructor(scene, x, y, falling = true) {
    super(scene, x, y, 'catKikiMinion', 1)
    this.scoreValue = 100
    this.damage = 1
    this.body.setSize(20, 20)
    this.falling = falling
    this.fallSpeed = 80
    if (!falling) {
      this.moveDir = 1
      this.moveSpeed = 60
      this.moveTime = 0
    }
  }

  update(time, delta) {
    if (!this.alive) return
    if (this.falling) {
      this.y += this.fallSpeed * (delta / 1000)
      if (this.y > GAME_HEIGHT + 32) {
        // Out of bounds — silently remove (no points, no game over)
        this.alive = false
        this.destroy()
      }
    } else {
      this.x += this.moveDir * this.moveSpeed * (delta / 1000)
      this.moveTime += delta
      if (this.moveTime > 1500) {
        this.moveTime = 0
        this.moveDir = -this.moveDir
      }
    }
  }
}
