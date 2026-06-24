import Phaser from 'phaser'
import { SCENES } from '../config/constants.js'

/**
 * Boot scene — minimal init, hands off to PreloadScene.
 * No assets loaded here. Phaser config (scale, pixel art, physics) is
 * already applied via gameConfig.js.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT)
  }

  create() {
    // eslint-disable-next-line no-console
    console.log('[BootScene] Booted.')
    this.scene.start(SCENES.PRELOAD)
  }
}
