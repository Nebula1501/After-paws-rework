export default class LogoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LogoScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Black background
    this.cameras.main.setBackgroundColor('#000000');

    // Create logo image centered on screen
    const logo = this.add.image(width / 2, height / 2, 'logo');
    logo.setOrigin(0.5, 0.5);

    // Scale logo to fit screen nicely (adjust as needed)
    const scale = Math.min(width / logo.width, height / logo.height) * 0.8;
    logo.setScale(scale);

    // Start with logo invisible
    logo.setAlpha(0);

    // Fade in logo
    this.tweens.add({
      targets: logo,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // Wait 2 seconds, then fade out and transition to intro
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: logo,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
              this.scene.start('IntroScene');
            }
          });
        });
      }
    });
  }
}
