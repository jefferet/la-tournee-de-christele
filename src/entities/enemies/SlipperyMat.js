import Phaser from 'phaser'
import { EnemyBase } from './EnemyBase.js'

/**
 * SlipperyMat — static obstacle, just a slick rug on the floor.
 * Damages Christele on contact. No HP (indestructible).
 */
export class SlipperyMat extends EnemyBase {
  constructor(scene, x, y) {
    // HP = Infinity (use a very large number)
    super(scene, x, y, 'slipperyMat', 9999)
    this.scoreValue = 0  // No points, can't be killed
    this.damage = 1
    this.indestructible = true

    // Bigger hitbox for the mat
    this.body.setSize(32, 16)
  }

  takeDamage(amount) {
    // Indestructible
    return false
  }
}
