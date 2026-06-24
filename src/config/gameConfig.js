import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js'
import { BootScene } from '../scenes/BootScene.js'
import { PreloadScene } from '../scenes/PreloadScene.js'
import { MenuScene } from '../scenes/MenuScene.js'
import { PatientLevelScene } from '../scenes/PatientLevelScene.js'

/**
 * Phaser.Game configuration.
 * See DOC-TECHNIQUE-V1.md section 24 for details.
 */
export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    zoom: 1,
  },
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false, // flip to true to see hitboxes
    },
  },
  fps: {
    target: 60,
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  audio: {
    disableWebAudio: false,
    noAudio: false,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    PatientLevelScene,
  ],
}
