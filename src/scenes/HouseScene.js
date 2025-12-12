import TaskManager from '../systems/TaskManager.js';
import InteractionManager from '../systems/InteractionManager.js';
import DistractionManager from '../systems/DistractionManager.js';
import EndingManager from '../systems/EndingManager.js';

export default class HouseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HouseScene' });
  }

  create() {
    // Initialize systems
    this.taskManager = new TaskManager(this);
    this.interactionManager = new InteractionManager(this);
    this.distractionManager = new DistractionManager(this);
    this.endingManager = new EndingManager(this);

    // World bounds - match Photoshop canvas size (2360x1640)
    this.physics.world.setBounds(0, 0, 2360, 1640);

    // Build the house layers (bottom to top)
    this.createFloors();
    this.createWalls();
    this.createFurniture();
    this.createProps();
    this.createDirt();
    this.createCharacters();

    // Setup camera to follow cat
    this.cameras.main.startFollow(this.cat, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 2360, 1640);
    this.cameras.main.setZoom(1);

    // Debug: Add grid overlay and coordinate display
    this.createDebugOverlay();

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Start UI scene as overlay
    this.scene.launch('UIScene');

    // Player movement enabled flag
    this.playerCanMove = true;

    // Cat glow effect (spiritual)
    this.catGlowTween = this.tweens.add({
      targets: this.cat,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Start background music with fade in
    this.bgMusic = this.sound.add('bgMusic', {
      loop: true,
      volume: 0
    });
    this.bgMusic.play();

    // Fade in music over 3 seconds
    this.tweens.add({
      targets: this.bgMusic,
      volume: 0.5,
      duration: 3000,
      ease: 'Power2'
    });
  }

  createFloors() {
    // Load all floor tiles at (0,0) - bathroom tile first, then wood floor on top
    this.bathroomTile = this.add.image(0, 0, 'bathroomTile').setOrigin(0, 0).setDepth(0);
    this.floorWood = this.add.image(0, 0, 'floorWood').setOrigin(0, 0).setDepth(1);
  }

  createWalls() {
    this.walls = this.add.image(0, 0, 'walls').setOrigin(0, 0).setDepth(10);

    // Wall colliders - create group for owner collisions
    this.wallColliders = this.physics.add.staticGroup();

    // Outer boundary walls (world edges)
    // Top wall
    this.wallColliders.create(1180, 0, null).setSize(2360, 20).setVisible(false).refreshBody();
    // Bottom wall
    this.wallColliders.create(1180, 1640, null).setSize(2360, 20).setVisible(false).refreshBody();
    // Left wall
    this.wallColliders.create(0, 820, null).setSize(20, 1640).setVisible(false).refreshBody();
    // Right wall
    this.wallColliders.create(2360, 820, null).setSize(20, 1640).setVisible(false).refreshBody();
  }

  createFurniture() {
    // Load room furniture items
    this.bedroomItems = this.add.image(0, 0, 'bedroomItems').setOrigin(0, 0).setDepth(20);
    this.kitchenItems = this.add.image(0, 0, 'kitchenItems').setOrigin(0, 0).setDepth(20);
    this.livingRoomItems = this.add.image(0, 0, 'livingRoomItems').setOrigin(0, 0).setDepth(20);
    this.bathroomItems = this.add.image(0, 0, 'bathroomItems').setOrigin(0, 0).setDepth(20);

    // Bed variants (start with messy)
    this.bedMessy = this.add.image(0, 0, 'bedMessy').setOrigin(0, 0).setDepth(21);
    this.bedMessy.setVisible(true);
    this.bedNeat = this.add.image(0, 0, 'bedNeat').setOrigin(0, 0).setDepth(21);
    this.bedNeat.setVisible(false);

    // Fridge (separate interactive sprite)
    this.fridge = this.add.image(0, 0, 'fridge').setOrigin(0, 0).setDepth(22);

    // Furniture colliders - empty for now, need proper positions
    this.furnitureColliders = this.physics.add.staticGroup();

    // TODO: Add colliders based on actual sprite positions
    // For now, removed all placeholder colliders since they were incorrectly positioned
  }

  createProps() {
    // Create all prop/clutter sprites
    this.chips = this.add.image(0, 0, 'chips').setOrigin(0, 0).setDepth(30);
    this.clothes = this.add.image(0, 0, 'clothes').setOrigin(0, 0).setDepth(30);
    this.boxes = this.add.image(0, 0, 'boxes').setOrigin(0, 0).setDepth(30);
    this.books = this.add.image(0, 0, 'books').setOrigin(0, 0).setDepth(30);
    this.plates = this.add.image(0, 0, 'plates').setOrigin(0, 0).setDepth(30);
    this.utensils = this.add.image(0, 0, 'utensils').setOrigin(0, 0).setDepth(30);
    this.broom = this.add.image(0, 0, 'broom').setOrigin(0, 0).setDepth(30);
    this.catItems = this.add.image(0, 0, 'catItems').setOrigin(0, 0).setDepth(30);
    this.stand = this.add.image(0, 0, 'stand').setOrigin(0, 0).setDepth(30);

    // Store references for interaction manager
    this.interactableProps = {
      chips: this.chips,
      clothes: this.clothes,
      boxes: this.boxes,
      books: this.books,
      plates: this.plates,
      utensils: this.utensils,
      broom: this.broom,
      bedMessy: this.bedMessy,
      bedNeat: this.bedNeat
    };
  }

  createDirt() {
    // Create dirt overlays (visible at start, will be hidden when cleaned)
    this.dirtSplashes = this.add.image(0, 0, 'dirtSplashes').setOrigin(0, 0).setDepth(25);
    this.livingroomDirt = this.add.image(0, 0, 'livingroomDirt').setOrigin(0, 0).setDepth(25);
    this.dirtyTableSplotches = this.add.image(0, 0, 'dirtyTableSplotches').setOrigin(0, 0).setDepth(25);

    // Store references for task completion
    this.dirtSprites = {
      dirtSplashes: this.dirtSplashes,
      livingroomDirt: this.livingroomDirt,
      dirtyTableSplotches: this.dirtyTableSplotches
    };
  }

  createCharacters() {
    // Create cat (player) - GHOST, no collisions! Starts at user-provided position
    this.cat = this.physics.add.sprite(1452, 1275, 'catFront');
    this.cat.setDepth(50);
    this.cat.setScale(1);
    this.cat.body.setSize(32, 32);
    // Cat is a ghost - can pass through everything, only constrained by world bounds
    this.cat.setCollideWorldBounds(true);

    // Cat movement variables
    this.catSpeed = 150;
    this.catCurrentSprite = 'catFront';

    // Create owner (NPC) - starts at user-provided position
    this.owner = this.physics.add.sprite(489, 256, 'humanFront');
    this.owner.setDepth(50);
    this.owner.setScale(1);
    this.owner.body.setSize(32, 32);
    this.owner.setCollideWorldBounds(true);

    // Owner state
    this.ownerState = 'idle'; // idle, walking, cleaning, distracted
    this.ownerCurrentTask = null;

    // Owner movement target (for physics-based pathfinding)
    this.ownerTarget = null;
    this.ownerMoveCallback = null;
    this.ownerSpeed = 100;

    // Setup collisions - ONLY OWNER collides with walls/furniture, cat is a ghost!
    this.physics.add.collider(this.owner, this.wallColliders);
    this.physics.add.collider(this.owner, this.furnitureColliders);

    // Define all interactive object positions (from user coordinates - midpoints)
    this.interactiveObjects = {
      bed: { x: 261, y: 244, radius: 100 }, // For making bed task
      fridge: { x: 1454, y: 765, radius: 80 },
      catBowl1: { x: 771, y: 116, radius: 60 },
      catBowl2: { x: 1676, y: 698, radius: 60 },
      catBowl3: { x: 896, y: 1303, radius: 60 },
      books1: { x: 771, y: 319, radius: 60 },
      books2: { x: 669, y: 159, radius: 60 },
      wardrobe: { x: 564, y: 29, radius: 80 },
      chair1: { x: 1046, y: 283, radius: 60 },
      chair2: { x: 1351, y: 73, radius: 60 },
      chair3: { x: 2037, y: 104, radius: 60 },
      table1: { x: 1351, y: 290, radius: 80 },
      boxes1: { x: 1857, y: 285, radius: 60 },
      boxes2: { x: 1717, y: 195, radius: 60 },
      catToy: { x: 1717, y: 355, radius: 60 },
      table2_chips: { x: 1216, y: 1038, radius: 80 }, // Coffee table with chips
      stove1: { x: 1216, y: 725, radius: 80 },
      stove2: { x: 846, y: 913, radius: 80 },
      tub: { x: 496, y: 896, radius: 80 },
      toilet: { x: 152, y: 705, radius: 60 },
      washingMachine1: { x: 68, y: 1037, radius: 60 },
      washingMachine2: { x: 68, y: 1262, radius: 60 }
    };

    // Fridge position for taskboard interaction
    this.fridgePosition = this.interactiveObjects.fridge;
  }

  handleCatMovement() {
    let velocityX = 0;
    let velocityY = 0;

    // Check arrow keys or WASD
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      velocityX = -this.catSpeed;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      velocityX = this.catSpeed;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      velocityY = -this.catSpeed;
      this.cat.setTexture('catBack');
      this.catCurrentSprite = 'catBack';
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      velocityY = this.catSpeed;
      this.cat.setTexture('catFront');
      this.catCurrentSprite = 'catFront';
    }

    // Apply velocity
    this.cat.setVelocity(velocityX, velocityY);

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      this.cat.body.velocity.normalize().scale(this.catSpeed);
    }

    // For left/right, keep current front/back sprite or flip if needed
    if (velocityX !== 0 && velocityY === 0) {
      this.cat.setFlipX(velocityX < 0);
    }
  }

  checkFridgeInteraction() {
    const distance = Phaser.Math.Distance.Between(
      this.cat.x, this.cat.y,
      this.fridgePosition.x, this.fridgePosition.y
    );

    if (distance < this.fridgePosition.radius && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      // Open taskboard
      this.scene.get('UIScene').openTaskboard();
    }
  }

  // Helper method to move owner to a location using physics-based movement
  moveOwnerToLocation(x, y, onComplete) {
    this.ownerState = 'walking';
    this.ownerTarget = { x, y };
    this.ownerMoveCallback = onComplete;
  }

  // Update owner movement towards target (called in update loop)
  updateOwnerMovement() {
    if (!this.ownerTarget || this.ownerState !== 'walking') {
      return;
    }

    const { x: targetX, y: targetY } = this.ownerTarget;
    const distance = Phaser.Math.Distance.Between(this.owner.x, this.owner.y, targetX, targetY);
    const arrivalThreshold = 10;

    // Check if owner has arrived
    if (distance < arrivalThreshold) {
      this.owner.setVelocity(0, 0);
      this.ownerTarget = null;
      this.ownerState = 'cleaning';

      if (this.ownerMoveCallback) {
        const callback = this.ownerMoveCallback;
        this.ownerMoveCallback = null;
        callback();
      }
      return;
    }

    // Calculate direction to target
    const angle = Phaser.Math.Angle.Between(this.owner.x, this.owner.y, targetX, targetY);
    const velocityX = Math.cos(angle) * this.ownerSpeed;
    const velocityY = Math.sin(angle) * this.ownerSpeed;

    // Apply velocity
    this.owner.setVelocity(velocityX, velocityY);

    // Update sprite based on movement direction
    if (Math.abs(velocityY) > Math.abs(velocityX)) {
      // Vertical movement dominant
      if (velocityY < 0) {
        this.owner.setTexture('humanBack');
      } else {
        this.owner.setTexture('humanFront');
      }
      this.owner.setFlipX(false);
    } else {
      // Horizontal movement dominant
      this.owner.setTexture('humanFront');
      this.owner.setFlipX(velocityX < 0);
    }
  }

  // Stop owner movement (used when distracted or interrupted)
  stopOwnerMovement() {
    this.owner.setVelocity(0, 0);
    this.ownerTarget = null;
    this.ownerMoveCallback = null;
  }

  // Method to lock/unlock player movement
  setPlayerMovement(canMove) {
    this.playerCanMove = canMove;
  }

  // Debug overlay with grid and coordinates
  createDebugOverlay() {
    // Create graphics for grid
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(1000);

    // Draw grid lines every 100 pixels
    this.debugGraphics.lineStyle(1, 0x00ff00, 0.3);

    // Vertical lines
    for (let x = 0; x <= 2360; x += 100) {
      this.debugGraphics.lineBetween(x, 0, x, 1640);
    }

    // Horizontal lines
    for (let y = 0; y <= 1640; y += 100) {
      this.debugGraphics.lineBetween(0, y, 2360, y);
    }

    // Add thicker lines every 500 pixels
    this.debugGraphics.lineStyle(2, 0xff0000, 0.5);
    for (let x = 0; x <= 2360; x += 500) {
      this.debugGraphics.lineBetween(x, 0, x, 1640);
    }
    for (let y = 0; y <= 1640; y += 500) {
      this.debugGraphics.lineBetween(0, y, 2360, y);
    }

    // Create coordinate display text (fixed to camera)
    this.debugCoordText = this.add.text(10, 10, '', {
      font: 'bold 16px monospace',
      fill: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.debugCoordText.setScrollFactor(0);
    this.debugCoordText.setDepth(2000);

    // Create owner coordinate display
    this.debugOwnerText = this.add.text(10, 40, '', {
      font: 'bold 16px monospace',
      fill: '#ffaa00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.debugOwnerText.setScrollFactor(0);
    this.debugOwnerText.setDepth(2000);

    // Create world info display
    this.debugWorldText = this.add.text(10, 70, 'World: 2360x1640 | Canvas from Photoshop', {
      font: 'bold 14px monospace',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.debugWorldText.setScrollFactor(0);
    this.debugWorldText.setDepth(2000);
  }

  update() {
    if (!this.playerCanMove) {
      this.cat.setVelocity(0, 0);

      // Update debug display even when paused
      if (this.debugCoordText) {
        this.debugCoordText.setText(`Cat: (${Math.round(this.cat.x)}, ${Math.round(this.cat.y)})`);
        this.debugOwnerText.setText(`Owner: (${Math.round(this.owner.x)}, ${Math.round(this.owner.y)})`);
      }

      return;
    }

    // Cat movement
    this.handleCatMovement();

    // Owner physics-based movement
    this.updateOwnerMovement();

    // Check fridge interaction (SPACE key)
    this.checkFridgeInteraction();

    // Check item interactions (E key)
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.interactionManager.checkInteraction(this.cat, this.owner);
    }

    // Update distraction manager
    this.distractionManager.update(this.owner);

    // Update debug coordinate display
    if (this.debugCoordText) {
      this.debugCoordText.setText(`Cat: (${Math.round(this.cat.x)}, ${Math.round(this.cat.y)})`);
      this.debugOwnerText.setText(`Owner: (${Math.round(this.owner.x)}, ${Math.round(this.owner.y)})`);
    }
  }
}
