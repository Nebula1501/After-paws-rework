export default class DistractionManager {
  constructor(scene) {
    this.scene = scene;

    // Define distraction trigger points based on GDD section 5
    // These are cat-related objects that trigger grief episodes
    this.distractionTriggers = [
      { name: 'Cat bowl', x: 130, y: 70, radius: 50, dialogue: "Your bowl... I keep expecting you to run to it." },
      { name: 'Cat items', x: 250, y: 150, radius: 50, dialogue: "It still smells like you..." },
      { name: 'Living room cat toy', x: 720, y: 240, radius: 50, dialogue: "You used to love playing here..." },
      { name: 'Cat stand', x: 1050, y: 200, radius: 50, dialogue: "Your favorite spot by the window..." }
    ];

    this.isDistracted = false;
    this.currentDistraction = null;
    this.distractionCheckRadius = 60;
    this.lastTriggeredDistraction = null;
  }

  update(owner) {
    // Only check for distractions when owner is walking (during a task)
    if (this.scene.ownerState !== 'walking' || this.isDistracted) {
      return;
    }

    // Check if owner is near any distraction trigger
    for (let trigger of this.distractionTriggers) {
      const distance = Phaser.Math.Distance.Between(owner.x, owner.y, trigger.x, trigger.y);

      if (distance < trigger.radius) {
        // Don't trigger same distraction twice in a row
        if (this.lastTriggeredDistraction === trigger) {
          continue;
        }

        // Trigger distraction
        this.triggerDistraction(trigger);
        break;
      }
    }
  }

  triggerDistraction(trigger) {
    console.log(`Distraction triggered: ${trigger.name}`);

    this.isDistracted = true;
    this.currentDistraction = trigger;
    this.lastTriggeredDistraction = trigger;

    const owner = this.scene.owner;

    // Stop owner movement
    this.scene.stopOwnerMovement();
    this.scene.ownerState = 'distracted';

    // Visual effects: dim colors, head lower (simulate with tint/alpha)
    this.scene.tweens.add({
      targets: owner,
      alpha: 0.7,
      duration: 500,
      ease: 'Power2'
    });

    // Dim the entire scene slightly
    this.dimOverlay = this.scene.add.rectangle(
      this.scene.cameras.main.scrollX + this.scene.cameras.main.width / 2,
      this.scene.cameras.main.scrollY + this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0.3
    );
    this.dimOverlay.setDepth(45); // Below characters but above environment
    this.dimOverlay.setScrollFactor(0);

    // Show grief dialogue
    this.showGriefDialogue(trigger.dialogue);

    // Instruction to refocus
    this.showRefocusInstruction();
  }

  showGriefDialogue(text) {
    const owner = this.scene.owner;

    this.griefBubble = this.scene.add.container(owner.x, owner.y - 70);
    this.griefBubble.setDepth(100);

    const bubbleBg = this.scene.add.rectangle(0, 0, 300, 60, 0x333333, 0.9);
    bubbleBg.setStrokeStyle(2, 0x666666);

    const bubbleText = this.scene.add.text(0, 0, text, {
      font: 'italic 14px Arial',
      fill: '#cccccc',
      align: 'center',
      wordWrap: { width: 280 }
    });
    bubbleText.setOrigin(0.5, 0.5);

    this.griefBubble.add([bubbleBg, bubbleText]);
  }

  showRefocusInstruction() {
    const width = this.scene.cameras.main.width;

    this.refocusText = this.scene.add.text(
      this.scene.cameras.main.scrollX + width / 2,
      this.scene.cameras.main.scrollY + 150,
      'Press E on the task item again to help him refocus...',
      {
        font: 'bold 18px Arial',
        fill: '#ffaa00',
        backgroundColor: '#333333',
        padding: { x: 15, y: 8 },
        align: 'center'
      }
    );
    this.refocusText.setOrigin(0.5, 0.5);
    this.refocusText.setDepth(2000);
    this.refocusText.setScrollFactor(0);
    this.refocusText.setAlpha(0);

    this.scene.tweens.add({
      targets: this.refocusText,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
  }

  refocusOwner() {
    if (!this.isDistracted) return;

    console.log('Owner refocused!');

    const owner = this.scene.owner;

    // Clear distraction state
    this.isDistracted = false;

    // Restore owner alpha
    this.scene.tweens.add({
      targets: owner,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });

    // Remove dim overlay
    if (this.dimOverlay) {
      this.scene.tweens.add({
        targets: this.dimOverlay,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.dimOverlay.destroy();
          this.dimOverlay = null;
        }
      });
    }

    // Remove grief bubble
    if (this.griefBubble) {
      this.scene.tweens.add({
        targets: this.griefBubble,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.griefBubble.destroy();
          this.griefBubble = null;
        }
      });
    }

    // Remove refocus instruction
    if (this.refocusText) {
      this.scene.tweens.add({
        targets: this.refocusText,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.refocusText.destroy();
          this.refocusText = null;
        }
      });
    }

    // Show owner's refocus dialogue
    this.showRefocusDialogue();

    // Resume the current task after brief delay
    this.scene.time.delayedCall(1500, () => {
      if (this.scene.ownerCurrentTask) {
        const task = this.scene.ownerCurrentTask;
        this.scene.moveOwnerToLocation(task.targetLocation.x, task.targetLocation.y, () => {
          this.scene.interactionManager.performCleaningAnimation(owner, task);
        });
      } else {
        this.scene.ownerState = 'idle';
      }
    });
  }

  showRefocusDialogue() {
    const owner = this.scene.owner;

    const dialogues = [
      "Right... I can continue.",
      "Okay... back to it.",
      "I need to keep going.",
      "Focus... one thing at a time."
    ];

    const text = dialogues[Math.floor(Math.random() * dialogues.length)];

    const bubble = this.scene.add.container(owner.x, owner.y - 60);
    bubble.setDepth(100);

    const bubbleBg = this.scene.add.rectangle(0, 0, 200, 40, 0xffffff, 0.9);
    bubbleBg.setStrokeStyle(2, 0x333333);

    const bubbleText = this.scene.add.text(0, 0, text, {
      font: '14px Arial',
      fill: '#333333',
      align: 'center'
    });
    bubbleText.setOrigin(0.5, 0.5);

    bubble.add([bubbleBg, bubbleText]);

    // Fade out after delay
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: bubble,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          bubble.destroy();
        }
      });
    });
  }
}
