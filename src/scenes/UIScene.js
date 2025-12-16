export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.isTaskboardOpen = false;

    // Get reference to house scene
    this.houseScene = this.scene.get('HouseScene');

    // Create controls guide (top-right corner)
    this.createControlsGuide();

    // Create taskboard container (hidden by default)
    this.createTaskboard();

    // ESC key to close taskboard
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  createControlsGuide() {
    const width = this.cameras.main.width;
    const padding = 20;

    // Container for controls guide
    this.controlsContainer = this.add.container(width - padding, padding);
    this.controlsContainer.setDepth(900); // Below taskboard (1000) but above game elements
    this.controlsContainer.setScrollFactor(0); // Fixed to camera

    // Semi-transparent background panel
    const panelWidth = 200;
    const panelHeight = 100;
    const controlsBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.6);
    controlsBg.setOrigin(1, 0); // Align to top-right
    controlsBg.setStrokeStyle(2, 0xffffff, 0.3);
    this.controlsContainer.add(controlsBg);

    // Controls text
    const controlsText = this.add.text(-panelWidth + 10, 10,
      'CONTROLS:\n\n' +
      'WASD - Move\n' +
      'E - Interact with tasks\n' +
      'SPACE - Interact with fridge',
      {
        font: '12px monospace',
        fill: '#ffffff',
        align: 'left',
        lineSpacing: 4
      }
    );
    controlsText.setOrigin(0, 0);
    this.controlsContainer.add(controlsText);
  }

  createTaskboard() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Container for all taskboard elements
    this.taskboardContainer = this.add.container(0, 0);
    this.taskboardContainer.setDepth(1000);
    this.taskboardContainer.setVisible(false);

    // Semi-transparent dark overlay
    this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.taskboardContainer.add(this.overlay);

    // Main taskboard background (sticky note style) - made taller to fit all 8 tasks
    this.taskboardBg = this.add.rectangle(width / 2, height / 2, 650, 700, 0xffeb9e);
    this.taskboardBg.setStrokeStyle(4, 0x8b7355);
    this.taskboardContainer.add(this.taskboardBg);

    // Title
    this.taskboardTitle = this.add.text(width / 2, height / 2 - 320, 'Things to do...', {
      font: 'bold 32px Arial',
      fill: '#333333',
      align: 'center'
    });
    this.taskboardTitle.setOrigin(0.5, 0.5);
    this.taskboardContainer.add(this.taskboardTitle);

    // Paw print decoration (memory of cat)
    this.pawPrint = this.add.text(width / 2 + 250, height / 2 - 300, '🐾', {
      font: '24px Arial'
    });
    this.pawPrint.setAlpha(0.3);
    this.taskboardContainer.add(this.pawPrint);

    // Task list container - centered properly inside sticky note
    this.taskListContainer = this.add.container(width / 2 - 290, height / 2 - 260);
    this.taskboardContainer.add(this.taskListContainer);

    // Close instruction
    this.closeText = this.add.text(width / 2, height / 2 + 330, 'Press ESC to close', {
      font: '18px Arial',
      fill: '#666666',
      align: 'center'
    });
    this.closeText.setOrigin(0.5, 0.5);
    this.taskboardContainer.add(this.closeText);

    // Task text objects (will be populated dynamically)
    this.taskTexts = [];
  }

  openTaskboard() {
    if (this.isTaskboardOpen) return;

    this.isTaskboardOpen = true;
    this.taskboardContainer.setVisible(true);

    // Pause player movement
    this.houseScene.setPlayerMovement(false);

    // Update task list
    this.updateTaskList();

    // Fade in effect
    this.taskboardContainer.setAlpha(0);
    this.tweens.add({
      targets: this.taskboardContainer,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  closeTaskboard() {
    if (!this.isTaskboardOpen) return;

    this.tweens.add({
      targets: this.taskboardContainer,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.isTaskboardOpen = false;
        this.taskboardContainer.setVisible(false);

        // Resume player movement
        this.houseScene.setPlayerMovement(true);
      }
    });
  }

  updateTaskList() {
    // Clear existing task texts
    this.taskTexts.forEach(text => text.destroy());
    this.taskTexts = [];

    // Get tasks from TaskManager
    const taskManager = this.houseScene.taskManager;
    const tasks = taskManager.getTasks();

    let yOffset = 0;

    tasks.forEach((task) => {
      // Determine color and checkbox based on state
      let noteColor = 0xffffaa; // Yellow = pending
      let checkbox = '☐';
      let strikethrough = false;

      if (task.isComplete) {
        noteColor = 0xaaffaa; // Green = completed
        checkbox = '☑';
        strikethrough = true;
      } else if (task.inProgress) {
        noteColor = 0xaad4ff; // Blue = in progress
        checkbox = '▶';
      }

      // Note background - smaller and contained
      const noteBg = this.add.rectangle(285, yOffset + 30, 560, 70, noteColor);
      noteBg.setStrokeStyle(2, 0x8b7355);
      this.taskListContainer.add(noteBg);

      // Task text
      let taskText = `${checkbox}  ${task.name}`;
      if (strikethrough) {
        taskText = `${checkbox}  ̶${task.name}̶`; // Strikethrough effect
      }

      const text = this.add.text(15, yOffset + 10, taskText, {
        font: task.isComplete ? 'italic 16px Arial' : 'bold 16px Arial',
        fill: task.isComplete ? '#666666' : '#333333',
        wordWrap: { width: 540 }
      });
      this.taskListContainer.add(text);

      // Task description (smaller)
      const descText = this.add.text(15, yOffset + 35, task.description, {
        font: '12px Arial',
        fill: '#555555',
        wordWrap: { width: 540 }
      });
      this.taskListContainer.add(descText);

      this.taskTexts.push(noteBg, text, descText);

      yOffset += 75;
    });
  }

  update() {
    // Check for ESC key to close taskboard
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (this.isTaskboardOpen) {
        this.closeTaskboard();
      }
    }
  }
}
