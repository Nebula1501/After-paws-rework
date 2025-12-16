export default class TaskManager {
  constructor(scene) {
    this.scene = scene;

    // Define all tasks based on GDD section 4.3
    this.tasks = [
      {
        id: 'makeBed',
        name: 'Make the bed',
        description: 'Straighten the bed and sheets.\nLocation: Bedroom',
        requiredItemKey: 'bedMessy',
        interactionObject: 'bed',
        targetLocation: { x: 261, y: 244 },
        room: 'bedroom',
        isComplete: false,
        inProgress: false,
        onComplete: () => {
          // Swap bed sprites
          this.scene.bedMessy.setVisible(false);
          this.scene.bedNeat.setVisible(true);
        }
      },
      {
        id: 'pickUpClothes',
        name: 'Pick up clothes',
        description: 'Gather scattered clothes from the floor.\nLocation: Bedroom',
        requiredItemKey: 'clothes',
        interactionObject: 'wardrobe',
        targetLocation: { x: 564, y: 29 },
        room: 'bedroom',
        isComplete: false,
        inProgress: false,
        onComplete: () => {
          // Hide clothes
          this.scene.clothes.setVisible(false);
        }
      },
      {
        id: 'organizeBooks',
        name: 'Organize books',
        description: 'Put books back on the shelf properly.\nLocation: Bedroom',
        requiredItemKey: 'books',
        interactionObject: 'books1',
        targetLocation: { x: 771, y: 319 },
        room: 'bedroom',
        isComplete: false,
        inProgress: false,
        onComplete: () => {
          // Hide scattered books (or reposition - for now, hide)
          this.scene.books.setVisible(false);
        }
      },
      {
        id: 'sweepFloor',
        name: 'Sweep the floor',
        description: 'Clean up the dirt and dust from floor.\nLocation: Living Room',
        requiredItemKey: 'broom',
        interactionObject: 'table1',
        targetLocation: { x: 1351, y: 290 },
        room: 'livingRoom',
        isComplete: false,
        inProgress: false,
        onComplete: () => {
          // Hide dirt splashes and livingroom dirt
          this.scene.dirtSprites.dirtSplashes.setVisible(false);
          this.scene.dirtSprites.livingroomDirt.setVisible(false);
        }
      },
      {
        id: 'wipeTable',
        name: 'Wipe the table',
        description: 'Clean the dirty coffee table.\nLocation: Living Room',
        requiredItemKey: 'dirtyTableSplotches',
        interactionObject: 'table2_chips',
        targetLocation: { x: 1216, y: 1038 },
        room: 'livingRoom',
        isComplete: false,
        inProgress: false,
        onComplete: () => {
          // Hide dirty table splotches
          this.scene.dirtSprites.dirtyTableSplotches.setVisible(false);
        }
      },
      {
        id: 'throwAwayChips',
        name: 'Throw away chips',
        description: 'Clean up empty chip bags and trash.\nLocation: Kitchen',
        requiredItemKey: 'chips',
        interactionObject: 'table2_chips',
        targetLocation: { x: 1216, y: 1038 },
        room: 'kitchen',
        isComplete: false,
        inProgress: false,
        onComplete: () => {
          // Hide chips
          this.scene.chips.setVisible(false);
        }
      },
      {
        id: 'washDishes',
        name: 'Wash dishes',
        description: 'Clean the dirty plates and utensils.\nLocation: Kitchen',
        requiredItemKey: 'plates',
        interactionObject: 'stove2',
        targetLocation: { x: 846, y: 911 },
        room: 'kitchen',
        isComplete: false,
        inProgress: false,
        onComplete: () => {
          // Hide dirty dishes
          this.scene.plates.setVisible(false);
          this.scene.utensils.setVisible(false);
        }
      },
      {
        id: 'takeOutTrash',
        name: 'Take out trash',
        description: 'Remove boxes and garbage.\nLocation: Kitchen',
        requiredItemKey: 'boxes',
        interactionObject: 'boxes1',
        targetLocation: { x: 1857, y: 285 },
        room: 'kitchen',
        isComplete: false,
        inProgress: false,
        onComplete: () => {
          // Hide boxes
          this.scene.boxes.setVisible(false);
        }
      }
    ];

    this.completedCount = 0;
  }

  getTasks() {
    return this.tasks;
  }

  getTaskByItemKey(itemKey) {
    return this.tasks.find(task => task.requiredItemKey === itemKey && !task.isComplete);
  }

  completeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || task.isComplete) return;

    // Mark as complete
    task.isComplete = true;
    task.inProgress = false;
    this.completedCount++;

    // Execute task completion effect
    if (task.onComplete) {
      task.onComplete();
    }

    // Play completion sound/effect (placeholder - add sound later)
    console.log(`Task completed: ${task.name}`);

    // Show brief completion message
    this.showTaskCompletionMessage(task.name);

    // Check if all tasks are done
    if (this.completedCount === this.tasks.length) {
      this.onAllTasksComplete();
    }
  }

  setTaskInProgress(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && !task.isComplete) {
      task.inProgress = true;
    }
  }

  showTaskCompletionMessage(taskName) {
    const width = this.scene.cameras.main.width;
    const message = this.scene.add.text(width / 2, 100, `✓ ${taskName} completed!`, {
      font: 'bold 24px Arial',
      fill: '#ffffff',
      backgroundColor: '#00aa00',
      padding: { x: 20, y: 10 }
    });
    message.setOrigin(0.5, 0.5);
    message.setScrollFactor(0); // Fixed to camera
    message.setDepth(2000);
    message.setAlpha(0);

    // Fade in, wait, fade out
    this.scene.tweens.add({
      targets: message,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: message,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              message.destroy();
            }
          });
        });
      }
    });
  }

  onAllTasksComplete() {
    console.log('All tasks completed! Triggering ending...');

    // Delay slightly before triggering ending
    this.scene.time.delayedCall(2000, () => {
      this.scene.endingManager.triggerEnding();
    });
  }

  isAllTasksComplete() {
    return this.completedCount === this.tasks.length;
  }
}
