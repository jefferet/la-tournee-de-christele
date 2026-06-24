import Phaser from 'phaser'
import { SYRINGE, GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js'

/**
 * Syringe — basic primary weapon projectile.
 * Uses the procedurally generated 'syringe' canvas texture registered in PreloadScene.
 */
export class Syringe extends Phaser.GameObjects.Image {
  constructor(scene, x, y, dirX, dirY) {
    super(scene, x, y, 'syringe')
    this.dirX = dirX
    this.dirY = dirY
    this.speed = SYRINGE.SPEED
    this.damage = SYRINGE.DAMAGE
    this.lifetime = SYRINGE.LIFETIME
    this.bornAt = scene.time.now

    // Rotate sprite to match direction
    this.rotation = Math.atan2(dirY, dirX)

    // Physics (used for movement via velocity, NOT for collision detection)
    scene.physics.add.existing(this)
    // Hitbox shape depends on the fire direction: the visible sprite is 16x6,
    // but it gets rotated via this.rotation to match dirX/dirY. Arcade Physics
    // bodies are axis-aligned (not rotated with the sprite), so a horizontal
    // body would extend sideways when the syringe is fired vertically.
    // → Use 16x6 for mostly-horizontal shots, swap to 6x16 for vertical shots.
    const vertical = Math.abs(dirY) > Math.abs(dirX)
    const w = vertical ? SYRINGE.HITBOX_V_W : SYRINGE.HITBOX_W
    const h = vertical ? SYRINGE.HITBOX_V_H : SYRINGE.HITBOX_H
    this.body.setSize(w, h)
    // Image 16x6, origin 0.5 → displayOrigin = (8, 3).
    // For the body to be centered on the image (regardless of vertical/horizontal):
    //   offset.x = displayOriginX - w/2 = 8 - w/2
    //   offset.y = displayOriginY - h/2 = 3 - h/2
    // horizontal (16x6): offset = (8-8, 3-3) = (0, 0)
    // vertical   (6x16): offset = (8-3, 3-8) = (5, -5)
    this.body.setOffset(8 - w / 2, 3 - h / 2)
    this.body.setVelocity(dirX * this.speed, dirY * this.speed)
  }

  /**
   * Returns the AABB hitbox used for collision with patients.
   * Horizontal: 16x6. Vertical: 6x16. Diagonal: oriented by dominant axis.
   */
  getHitbox() {
    const vertical = Math.abs(this.dirY) > Math.abs(this.dirX)
    if (vertical) {
      return { x: this.x - 3, y: this.y - 8, width: 6, height: 16 }
    }
    return { x: this.x - 8, y: this.y - 3, width: 16, height: 6 }
  }

  update(time, delta) {
    // Despawn if off-screen or expired
    if (time - this.bornAt > this.lifetime) {
      this.destroy()
      return
    }
    if (
      this.x < -32 || this.x > GAME_WIDTH + 32 ||
      this.y < -32 || this.y > GAME_HEIGHT + 32
    ) {
      this.destroy()
    }
  }
}
