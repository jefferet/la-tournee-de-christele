import Phaser from 'phaser'

/**
 * PowerUp — collectible item.
 * Types: carteVitale (+500 pts), cafe (+fire rate 8s)
 */
export class PowerUp extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type) {
    super(scene, x, y)
    this.scene = scene
    this.type = type
    this.collected = false
    this.bobTime = 0

    // Sprite
    this.sprite = scene.add.sprite(0, 0, `powerup_${type}`, 0)
    this.add(this.sprite)

    scene.physics.add.existing(this)
    this.body.setSize(16, 16)
    this.body.setImmovable(true)
  }

  update(time, delta) {
    if (this.collected) return
    // Bob up and down
    this.bobTime += delta
    this.sprite.y = Math.sin(this.bobTime / 200) * 2
  }

  collect() {
    if (this.collected) return
    this.collected = true
    this._apply()
    // Pickup animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 250,
      onComplete: () => this.destroy(),
    })
  }

  _apply() {
    if (!this.scene.state) return
    switch (this.type) {
      case 'carteVitale':
        this.scene.state.addScore(500)
        this.scene.showFloatingText(this.x, this.y, '+500', '#2ecc71')
        break
      case 'cafe':
        this.scene.state.addEffect({ type: 'fireRateBoost', multiplier: 1.5, duration: 8000 })
        this.scene.showFloatingText(this.x, this.y, 'CAFÉ!', '#f1c40f')
        break
    }
  }

  destroy(fromScene) {
    if (this.scene && this.scene.activePowerUps) {
      const idx = this.scene.activePowerUps.indexOf(this)
      if (idx >= 0) this.scene.activePowerUps.splice(idx, 1)
    }
    super.destroy(fromScene)
  }
}
