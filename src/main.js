import PreloadScene from './scenes/PreloadScene.js';
import IntroScene from './scenes/IntroScene.js';
import HouseScene from './scenes/HouseScene.js';
import UIScene from './scenes/UIScene.js';

const config = {
    type: Phaser.AUTO,
    title: 'After Paws',
    description: 'A game about love, loss, and the fragility of healing',
    parent: 'game-container',
    width: 1024,
    height: 768,
    backgroundColor: '#2d2d2d',
    pixelArt: true, // For crisp pixel art rendering
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down game, no gravity
            debug: true // Enable debug mode to see colliders
        }
    },
    scene: [
        PreloadScene,
        IntroScene,
        HouseScene,
        UIScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
