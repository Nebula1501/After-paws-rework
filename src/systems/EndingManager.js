export default class EndingManager {
  constructor(scene) {
    this.scene = scene;
  }

  triggerEnding() {
    console.log('Triggering ending sequence...');

    // Lock player input
    this.scene.playerCanMove = false;
    this.scene.cat.setVelocity(0, 0);

    // Start ending sequence based on GDD section 10
    this.phase1_Completion();
  }

  phase1_Completion() {
    // Phase 10.1: Completion Moment
    // House becomes fully lit, owner expresses relief

    const owner = this.scene.owner;

    // Brighten the scene
    this.scene.tweens.add({
      targets: [this.scene.floorWood, this.scene.bathroomTile],
      alpha: 1,
      duration: 2000,
      ease: 'Power2'
    });

    // Owner dialogue
    this.showEndingDialogue(owner, "I... think I can breathe now.", 3000, () => {
      this.scene.time.delayedCall(1000, () => {
        this.showEndingDialogue(owner, "I feel lighter... somehow.", 3000, () => {
          this.scene.time.delayedCall(1500, () => {
            this.phase2_CatAscends();
          });
        });
      });
    });
  }

  phase2_CatAscends() {
    // Phase 10.2: Cat Ascends
    const cat = this.scene.cat;

    // Stop cat glow tween
    if (this.scene.catGlowTween) {
      this.scene.catGlowTween.stop();
    }

    // Cat floats upward with particles
    this.createAscensionParticles(cat);

    this.scene.tweens.add({
      targets: cat,
      y: cat.y - 200,
      alpha: 0,
      duration: 3000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.phase3_FadeToWhite();
      }
    });
  }

  createAscensionParticles(cat) {
    // Simple particle effect using circles (could be replaced with actual particle system)
    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const particle = this.scene.add.circle(
          cat.x + Phaser.Math.Between(-20, 20),
          cat.y + Phaser.Math.Between(-20, 20),
          Phaser.Math.Between(3, 8),
          0xffffff,
          0.8
        );
        particle.setDepth(60);

        this.scene.tweens.add({
          targets: particle,
          y: particle.y - 100,
          alpha: 0,
          duration: 2000,
          ease: 'Power2',
          onComplete: () => {
            particle.destroy();
          }
        });
      });
    }
  }

  phase3_FadeToWhite() {
    // Phase 10.3: Fade to White → Fade Back to Room (Cat gone)

    // Fade to white
    this.scene.cameras.main.fadeOut(2000, 255, 255, 255);

    this.scene.cameras.main.once('camerafadeoutcomplete', () => {
      // Cat is now gone (already alpha 0)
      // Fade back in from white
      this.scene.cameras.main.fadeIn(2000, 255, 255, 255);

      this.scene.cameras.main.once('camerafadeincomplete', () => {
        this.phase4_TheQuiet();
      });
    });
  }

  phase4_TheQuiet() {
    // Phase 10.4: The Quiet
    const owner = this.scene.owner;

    // Camera slows down, focuses on owner
    this.scene.cameras.main.stopFollow();
    this.scene.cameras.main.pan(owner.x, owner.y, 2000, 'Power2');

    // Owner whispers
    this.scene.time.delayedCall(2000, () => {
      this.showEndingDialogue(owner, "...It's so quiet now.", 3000, () => {
        this.scene.time.delayedCall(1000, () => {
          this.showEndingDialogue(owner, "Too quiet.", 3000, () => {
            this.scene.time.delayedCall(2000, () => {
              this.phase5_VisualCollapse();
            });
          });
        });
      });
    });
  }

  phase5_VisualCollapse() {
    // Phase 10.5: Visual Collapse (Symbolic, Safe)
    // Show ending sequence images, then fade everything away

    const owner = this.scene.owner;
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Desaturate colors using tint (grayscale effect)
    const allSprites = [
      this.scene.floorWood,
      this.scene.bathroomTile,
      this.scene.walls,
      this.scene.bedroomItems,
      this.scene.kitchenItems,
      this.scene.livingRoomItems,
      this.scene.bathroomItems,
      this.scene.bedNeat,
      owner
    ];

    this.scene.tweens.add({
      targets: allSprites,
      alpha: 0.3,
      duration: 3000,
      ease: 'Power2'
    });

    // Darken entire scene
    this.collapseOverlay = this.scene.add.rectangle(
      owner.x,
      owner.y,
      this.scene.cameras.main.width * 2,
      this.scene.cameras.main.height * 2,
      0x000000,
      0
    );
    this.collapseOverlay.setDepth(80);

    this.scene.tweens.add({
      targets: this.collapseOverlay,
      alpha: 0.8,
      duration: 4000,
      ease: 'Power2',
      onComplete: () => {
        // Show ending image sequence
        this.showEndingImageSequence();
      }
    });
  }

  showEndingImageSequence() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const centerX = this.scene.cameras.main.scrollX + width / 2;
    const centerY = this.scene.cameras.main.scrollY + height / 2;

    // Create end_01 image
    const end01 = this.scene.add.image(centerX, centerY, 'end_01');
    end01.setOrigin(0.5, 0.5);
    end01.setDepth(90);
    end01.setScrollFactor(0);
    end01.setAlpha(0);
    end01.setScale(Math.min(width / end01.width, height / end01.height));

    // Fade in end_01
    this.scene.tweens.add({
      targets: end01,
      alpha: 1,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        // Wait, then transition to end_02
        this.scene.time.delayedCall(2000, () => {
          this.transitionToImage(end01, 'end_02', () => {
            // Transition to end_03
            this.scene.time.delayedCall(2000, () => {
              const end02 = this.scene.children.getByName('currentEndImage');
              this.transitionToImage(end02, 'end_03', () => {
                // Fade out end_03 and show game scene without owner
                this.scene.time.delayedCall(2000, () => {
                  this.fadeBackToSceneWithoutOwner();
                });
              });
            });
          });
        });
      }
    });
  }

  transitionToImage(currentImage, nextImageKey, onComplete) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const centerX = this.scene.cameras.main.scrollX + width / 2;
    const centerY = this.scene.cameras.main.scrollY + height / 2;

    // Create next image
    const nextImage = this.scene.add.image(centerX, centerY, nextImageKey);
    nextImage.setOrigin(0.5, 0.5);
    nextImage.setDepth(90);
    nextImage.setScrollFactor(0);
    nextImage.setAlpha(0);
    nextImage.setScale(Math.min(width / nextImage.width, height / nextImage.height));
    nextImage.setName('currentEndImage');

    // Cross-fade
    this.scene.tweens.add({
      targets: currentImage,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        currentImage.destroy();
      }
    });

    this.scene.tweens.add({
      targets: nextImage,
      alpha: 1,
      duration: 1500,
      ease: 'Power2',
      onComplete: onComplete
    });
  }

  fadeBackToSceneWithoutOwner() {
    const currentImage = this.scene.children.getByName('currentEndImage');

    // Hide owner
    this.scene.owner.setAlpha(0);

    // Fade out the ending image
    this.scene.tweens.add({
      targets: currentImage,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        currentImage.destroy();

        // Fade out the dark overlay
        this.scene.tweens.add({
          targets: this.collapseOverlay,
          alpha: 0,
          duration: 2000,
          ease: 'Power2'
        });

        // Now fade everything else out
        const allSprites = [
          this.scene.floorWood,
          this.scene.bathroomTile,
          this.scene.walls,
          this.scene.bedroomItems,
          this.scene.kitchenItems,
          this.scene.livingRoomItems,
          this.scene.bathroomItems,
          this.scene.bedNeat,
          this.scene.cat
        ];

        this.scene.tweens.add({
          targets: allSprites,
          alpha: 0,
          duration: 3000,
          ease: 'Power2',
          onComplete: () => {
            // Fade out music
            this.scene.tweens.add({
              targets: this.scene.bgMusic,
              volume: 0,
              duration: 3000,
              ease: 'Power2',
              onComplete: () => {
                this.scene.bgMusic.stop();
                this.phase6_FinalText();
              }
            });
          }
        });
      }
    });
  }

  phase6_FinalText() {
    // Phase 10.6: Final Text
    // "Some hearts can be cleaned... but not healed."

    this.scene.cameras.main.fadeOut(2000, 0, 0, 0);

    this.scene.cameras.main.once('camerafadeoutcomplete', () => {
      // Create final text screen
      this.showFinalTextScreen();
    });
  }

  showFinalTextScreen() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Black background
    this.scene.cameras.main.setBackgroundColor('#000000');

    // Final message
    const finalText = this.scene.add.text(
      this.scene.cameras.main.scrollX + width / 2,
      this.scene.cameras.main.scrollY + height / 2,
      'Some hearts can be cleaned...\nbut not healed.',
      {
        font: 'italic 28px Arial',
        fill: '#cccccc',
        align: 'center',
        lineSpacing: 10
      }
    );
    finalText.setOrigin(0.5, 0.5);
    finalText.setDepth(3000);
    finalText.setScrollFactor(0);
    finalText.setAlpha(0);

    // Fade in final text
    this.scene.tweens.add({
      targets: finalText,
      alpha: 1,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => {
        // Wait, then show credits/restart option
        this.scene.time.delayedCall(4000, () => {
          this.showCredits();
        });
      }
    });
  }

  showCredits() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const creditsText = this.scene.add.text(
      this.scene.cameras.main.scrollX + width / 2,
      this.scene.cameras.main.scrollY + height / 2 + 100,
      'After Paws\n\nA game about love, loss, and the fragility of healing.\n\n\nSwara - Character Artist\nSamyak - Environment Artist\nTanisha - Developer\nAbabil - Instructor\n\n\nPress SPACE to restart',
      {
        font: '18px Arial',
        fill: '#888888',
        align: 'center',
        lineSpacing: 8
      }
    );
    creditsText.setOrigin(0.5, 0.5);
    creditsText.setDepth(3000);
    creditsText.setScrollFactor(0);
    creditsText.setAlpha(0);

    this.scene.tweens.add({
      targets: creditsText,
      alpha: 1,
      duration: 2000,
      ease: 'Power2'
    });

    // Allow restart
    this.scene.input.keyboard.once('keydown-SPACE', () => {
      this.scene.scene.start('IntroScene');
    });
  }

  showEndingDialogue(owner, text, duration, onComplete) {
    const bubble = this.scene.add.container(owner.x, owner.y - 70);
    bubble.setDepth(100);

    const bubbleBg = this.scene.add.rectangle(0, 0, text.length * 9 + 30, 50, 0xffffff, 0.95);
    bubbleBg.setStrokeStyle(2, 0x333333);

    const bubbleText = this.scene.add.text(0, 0, text, {
      font: '16px Arial',
      fill: '#333333',
      align: 'center',
      wordWrap: { width: text.length * 9 + 20 }
    });
    bubbleText.setOrigin(0.5, 0.5);

    bubble.add([bubbleBg, bubbleText]);
    bubble.setAlpha(0);

    this.scene.tweens.add({
      targets: bubble,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets: bubble,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              bubble.destroy();
              if (onComplete) {
                onComplete();
              }
            }
          });
        });
      }
    });
  }
}
