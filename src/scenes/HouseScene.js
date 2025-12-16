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

    // Setup navigation system
    this.createNavigationWaypoints();

    // Setup camera to follow cat
    this.cameras.main.startFollow(this.cat, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 2360, 1640);
    this.cameras.main.setZoom(1);

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
    this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);

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

    // Interior wall colliders - exact data as provided
    const WALL_COLLIDERS = [
      { x: 827, y: 552, w: 729, h: 32 },
      { x: 1586, y: 552, w: 40, h: 872 },
      { x: 974, y: 16, w: 44, h: 396 },
      { x: 16, y: 1624, w: 1600, h: 40 },
      { x: 786, y: 1487, w: 48, h: 176 },
      { x: 784, y: 552, w: 182, h: 32 },
      { x: 786, y: 552, w: 44, h: 70 }
    ];

    // Create invisible static rectangle bodies for each wall collider
    this.wallColliderRects = [];
    WALL_COLLIDERS.forEach(wall => {
      // Create invisible rectangle
      const rect = this.add.rectangle(wall.x, wall.y, wall.w, wall.h, 0xff0000, 0);
      rect.setOrigin(0, 0);
      rect.setDepth(15); // Between walls (10) and furniture (20)

      // Convert to static physics body
      this.physics.add.existing(rect, true);

      // Add to wall colliders group
      this.wallColliders.add(rect);

      // Store reference for debug toggle
      this.wallColliderRects.push(rect);
    });

    // Outer boundary walls (world edges)
    const boundaryWalls = [
      { x: 1180, y: 0, w: 2360, h: 20 },      // Top
      { x: 1180, y: 1640, w: 2360, h: 20 },   // Bottom
      { x: 0, y: 820, w: 20, h: 1640 },       // Left
      { x: 2360, y: 820, w: 20, h: 1640 }     // Right
    ];

    boundaryWalls.forEach(wall => {
      const rect = this.add.rectangle(wall.x, wall.y, wall.w, wall.h, 0x0000ff, 0);
      rect.setOrigin(0.5, 0.5); // Boundary walls use center origin
      rect.setDepth(15);
      this.physics.add.existing(rect, true);
      this.wallColliders.add(rect);
      this.wallColliderRects.push(rect);
    });

    // Debug mode flag
    this.debugMode = false;
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

  // Navigation waypoints for pathfinding between rooms
  // EXACT COORDINATES FROM ANNOTATED FLOOR PLAN - DO NOT MODIFY
  createNavigationWaypoints() {
    // Coordinates provided by user - IMPLEMENTATION ONLY MODE
    this.navigationWaypoints = {
      // WALK_BEDROOM
      bedroom_center: { x: 377, y: 230 },
      bedroom_exit: { x: 825, y: 451 },

      // WALK_HALL zone
      hall_west: { x: 1147, y: 451 },
      hall_center: { x: 1323, y: 350 },
      hall_east: { x: 1626, y: 413 },

      // WALK_LIVINGROOM zone (vertical)
      livingroom_north: { x: 1796, y: 198 },
      livingroom_center: { x: 1954, y: 353 },
      livingroom_south: { x: 2020, y: 614 },

      // PASS_HALL_TO_KITCHEN zone (vertical passage on right)
      pass_hall_kitchen_top: { x: 1880, y: 882 },
      pass_hall_kitchen_mid: { x: 1880, y: 1212 },
      pass_hall_kitchen_bottom: { x: 1880, y: 1522 },

      // WALK_KITCHEN zone
      kitchen_north: { x: 1478, y: 1507 },
      kitchen_west: { x: 956, y: 877 },
      kitchen_east: { x: 1446, y: 911 },
      kitchen_center: { x: 1240, y: 1048 },
      kitchen_south: { x: 1004, y: 1193 },

      // PASS_KITCHEN_TO_BATHROOM zone
      pass_kitchen_bathroom: { x: 864, y: 1343 },

      // WALK_BATHROOM zone
      bathroom_north: { x: 179, y: 1040 },
      bathroom_center: { x: 179, y: 1175 },
      bathroom_south: { x: 179, y: 1318 }
    };

    // Define connections between waypoints (which waypoints connect to which)
    this.waypointConnections = {
      // WALK_BEDROOM connections
      bedroom_center: ['bedroom_exit'],
      bedroom_exit: ['bedroom_center', 'hall_west'],

      // WALK_HALL connections
      hall_west: ['bedroom_exit', 'hall_center'],
      hall_center: ['hall_west', 'hall_east'],
      hall_east: ['hall_center', 'livingroom_north'],

      // WALK_LIVINGROOM connections (vertical)
      livingroom_north: ['hall_east', 'livingroom_center'],
      livingroom_center: ['livingroom_north', 'livingroom_south'],
      livingroom_south: ['livingroom_center', 'pass_hall_kitchen_top'],

      // PASS_HALL_TO_KITCHEN (vertical passage)
      pass_hall_kitchen_top: ['livingroom_south', 'pass_hall_kitchen_mid'],
      pass_hall_kitchen_mid: ['pass_hall_kitchen_top', 'pass_hall_kitchen_bottom'],
      pass_hall_kitchen_bottom: ['pass_hall_kitchen_mid', 'kitchen_north'],

      // WALK_KITCHEN connections
      kitchen_north: ['pass_hall_kitchen_bottom', 'kitchen_center'],
      kitchen_center: ['kitchen_north', 'kitchen_west', 'kitchen_east'],
      kitchen_west: ['kitchen_center', 'kitchen_south'],
      kitchen_east: ['kitchen_center'],
      kitchen_south: ['kitchen_west', 'pass_kitchen_bathroom'],

      // PASS_KITCHEN_TO_BATHROOM
      pass_kitchen_bathroom: ['kitchen_south', 'bathroom_north'],

      // WALK_BATHROOM connections
      bathroom_north: ['pass_kitchen_bathroom', 'bathroom_center'],
      bathroom_center: ['bathroom_north', 'bathroom_south'],
      bathroom_south: ['bathroom_center']
    };
  }

  // Find the nearest waypoint to a given position
  findNearestWaypoint(x, y) {
    let nearestWaypoint = null;
    let minDistance = Infinity;

    for (const [name, waypoint] of Object.entries(this.navigationWaypoints)) {
      const distance = Phaser.Math.Distance.Between(x, y, waypoint.x, waypoint.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestWaypoint = name;
      }
    }

    return nearestWaypoint;
  }

  // Simple pathfinding using waypoints (BFS)
  findPath(startX, startY, endX, endY) {
    const startWaypoint = this.findNearestWaypoint(startX, startY);
    const endWaypoint = this.findNearestWaypoint(endX, endY);

    // If start and end are at the same waypoint, direct path
    if (startWaypoint === endWaypoint) {
      return [{ x: endX, y: endY }];
    }

    // BFS to find path through waypoints
    const queue = [[startWaypoint]];
    const visited = new Set([startWaypoint]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === endWaypoint) {
        // Found path - convert waypoint names to coordinates
        const coordinatePath = path.map(name => this.navigationWaypoints[name]);
        coordinatePath.push({ x: endX, y: endY }); // Add final destination
        return coordinatePath;
      }

      // Explore neighbors
      const neighbors = this.waypointConnections[current] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    // No path found - return direct path (fallback)
    return [{ x: endX, y: endY }];
  }

  // Helper method to move owner to a location using waypoint-based pathfinding
  moveOwnerToLocation(x, y, onComplete) {
    this.ownerState = 'walking';
    this.ownerMoveCallback = onComplete;

    // Find path from owner's current position to target
    this.ownerPath = this.findPath(this.owner.x, this.owner.y, x, y);
    this.ownerPathIndex = 0;

    // Set first waypoint as target
    if (this.ownerPath.length > 0) {
      this.ownerTarget = this.ownerPath[this.ownerPathIndex];
    }
  }

  // Update owner movement towards target (called in update loop)
  updateOwnerMovement() {
    if (!this.ownerTarget || this.ownerState !== 'walking') {
      return;
    }

    const { x: targetX, y: targetY } = this.ownerTarget;
    const distance = Phaser.Math.Distance.Between(this.owner.x, this.owner.y, targetX, targetY);
    const arrivalThreshold = 15;

    // Check if owner has arrived at current waypoint
    if (distance < arrivalThreshold) {
      // Move to next waypoint in path
      this.ownerPathIndex++;

      if (this.ownerPathIndex < this.ownerPath.length) {
        // Set next waypoint as target
        this.ownerTarget = this.ownerPath[this.ownerPathIndex];
      } else {
        // Reached final destination
        this.owner.setVelocity(0, 0);
        this.ownerTarget = null;
        this.ownerPath = null;
        this.ownerPathIndex = 0;
        this.ownerState = 'cleaning';

        if (this.ownerMoveCallback) {
          const callback = this.ownerMoveCallback;
          this.ownerMoveCallback = null;
          callback();
        }
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
    this.ownerPath = null;
    this.ownerPathIndex = 0;
    this.ownerMoveCallback = null;
  }

  // Method to lock/unlock player movement
  setPlayerMovement(canMove) {
    this.playerCanMove = canMove;
  }


  toggleDebugMode() {
    this.debugMode = !this.debugMode;

    // Toggle visibility of all wall collider rectangles
    this.wallColliderRects.forEach(rect => {
      if (this.debugMode) {
        rect.setFillStyle(0xff0000, 0.3); // Red at 30% opacity
      } else {
        rect.setFillStyle(0xff0000, 0); // Invisible
      }
    });

    // Toggle coordinate grid
    if (this.debugMode) {
      // Create coordinate grid if it doesn't exist
      if (!this.debugGrid) {
        this.debugGrid = this.add.graphics();
        this.debugGrid.setDepth(498);
        this.debugGrid.setScrollFactor(1, 1);

        // Draw vertical lines every 100 pixels
        this.debugGrid.lineStyle(1, 0xffffff, 0.2);
        for (let x = 0; x <= 2360; x += 100) {
          this.debugGrid.lineBetween(x, 0, x, 1640);

          // Add coordinate labels every 200 pixels
          if (x % 200 === 0) {
            const xLabel = this.add.text(x, 10, `${x}`, {
              font: '12px Arial',
              fill: '#ffffff',
              backgroundColor: '#000000',
              padding: { x: 2, y: 2 }
            });
            xLabel.setDepth(501);
            xLabel.setScrollFactor(1, 1);
            if (!this.debugGridLabels) this.debugGridLabels = [];
            this.debugGridLabels.push(xLabel);
          }
        }

        // Draw horizontal lines every 100 pixels
        for (let y = 0; y <= 1640; y += 100) {
          this.debugGrid.lineBetween(0, y, 2360, y);

          // Add coordinate labels every 200 pixels
          if (y % 200 === 0) {
            const yLabel = this.add.text(10, y, `${y}`, {
              font: '12px Arial',
              fill: '#ffffff',
              backgroundColor: '#000000',
              padding: { x: 2, y: 2 }
            });
            yLabel.setDepth(501);
            yLabel.setScrollFactor(1, 1);
            this.debugGridLabels.push(yLabel);
          }
        }
      }

      this.debugGrid.setVisible(true);
      if (this.debugGridLabels) {
        this.debugGridLabels.forEach(label => label.setVisible(true));
      }
    } else {
      if (this.debugGrid) {
        this.debugGrid.setVisible(false);
      }
      if (this.debugGridLabels) {
        this.debugGridLabels.forEach(label => label.setVisible(false));
      }
    }

    // Toggle waypoint visualization
    if (this.debugMode) {
      // Create waypoint markers if they don't exist
      if (!this.waypointMarkers) {
        this.waypointMarkers = [];
        for (const [name, waypoint] of Object.entries(this.navigationWaypoints)) {
          const marker = this.add.circle(waypoint.x, waypoint.y, 8, 0x00ff00, 0.6);
          marker.setDepth(500);
          this.waypointMarkers.push(marker);

          // Add label
          const label = this.add.text(waypoint.x, waypoint.y - 15, name, {
            font: '10px Arial',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 2, y: 2 }
          });
          label.setDepth(500);
          label.setOrigin(0.5, 0.5);
          this.waypointMarkers.push(label);
        }

        // Draw connections
        this.waypointConnections_graphics = this.add.graphics();
        this.waypointConnections_graphics.setDepth(499);
        this.waypointConnections_graphics.lineStyle(2, 0x00ff00, 0.3);

        for (const [name, connections] of Object.entries(this.waypointConnections)) {
          const start = this.navigationWaypoints[name];
          for (const connName of connections) {
            const end = this.navigationWaypoints[connName];
            if (start && end) {
              this.waypointConnections_graphics.lineBetween(start.x, start.y, end.x, end.y);
            }
          }
        }
      }

      // Show markers
      this.waypointMarkers.forEach(marker => marker.setVisible(true));
      if (this.waypointConnections_graphics) {
        this.waypointConnections_graphics.setVisible(true);
      }
    } else {
      // Hide markers
      if (this.waypointMarkers) {
        this.waypointMarkers.forEach(marker => marker.setVisible(false));
      }
      if (this.waypointConnections_graphics) {
        this.waypointConnections_graphics.setVisible(false);
      }
    }
  }

  update() {
    if (!this.playerCanMove) {
      this.cat.setVelocity(0, 0);
      return;
    }

    // Toggle debug mode (G key)
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.toggleDebugMode();
    }

    // Update debug coordinate display
    if (this.debugMode) {
      if (!this.debugCoordinateText) {
        this.debugCoordinateText = this.add.text(10, 10, '', {
          font: '16px Arial',
          fill: '#00ff00',
          backgroundColor: '#000000',
          padding: { x: 6, y: 6 }
        });
        this.debugCoordinateText.setDepth(502);
        this.debugCoordinateText.setScrollFactor(0, 0); // Fixed to camera
      }

      this.debugCoordinateText.setText(
        `Cat Position: (${Math.round(this.cat.x)}, ${Math.round(this.cat.y)})\n` +
        `Owner Position: (${Math.round(this.owner.x)}, ${Math.round(this.owner.y)})`
      );
      this.debugCoordinateText.setVisible(true);
    } else {
      if (this.debugCoordinateText) {
        this.debugCoordinateText.setVisible(false);
      }
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
  }
}
