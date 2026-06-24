import Phaser from 'phaser'
import { EnemyBase } from './EnemyBase.js'

/**
 * NewspaperStack — stack of newspapers L'Équipe.
 * Static, 2 HP, gives 100 points when destroyed.
 */
export class NewspaperStack extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'newspaperStack', 2)
    this.scoreValue = 100
    this.damage = 1
    this.body.setSize(24, 32)
  }
}
