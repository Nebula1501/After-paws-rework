export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      fill: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    // Load floor tiles
    this.load.image('floorWood', 'assets/floor_wood.png');
    this.load.image('bathroomTile', 'assets/Bathroom Tile.png');

    // Load walls
    this.load.image('walls', 'assets/walls.png');

    // Load room furniture
    this.load.image('bedroomItems', 'assets/bedroom items.png');
    this.load.image('kitchenItems', 'assets/kitchen Items.png');
    this.load.image('livingRoomItems', 'assets/living_room items.png');
    this.load.image('bathroomItems', 'assets/bathroom items.png');

    // Load separate fridge (interactive)
    this.load.image('fridge', 'assets/FRIDGE.png');

    // Load props and clutter
    this.load.image('chips', 'assets/chips.png');
    this.load.image('clothes', 'assets/clothes.png');
    this.load.image('boxes', 'assets/boxes.png');
    this.load.image('books', 'assets/books.png');
    this.load.image('plates', 'assets/plates.png');
    this.load.image('utensils', 'assets/utensils.png');
    this.load.image('broom', 'assets/broom.png');
    this.load.image('catItems', 'assets/cat items.png');
    this.load.image('stand', 'assets/stand.png');
    this.load.image('dirtSplashes', 'assets/dirt splashes.png');
    this.load.image('livingroomDirt', 'assets/livingroom dirt.png');
    this.load.image('dirtyTableSplotches', 'assets/Dirty Table Splotches.png');

    // Load bed variants
    this.load.image('bedMessy', 'assets/bedsheet_messy.png');
    this.load.image('bedNeat', 'assets/bedsheet_neat.png');

    // Load characters
    this.load.image('catFront', 'assets/cat_front.png');
    this.load.image('catBack', 'assets/cat_back.png');
    this.load.image('humanFront', 'assets/Human_front.png');
    this.load.image('humanBack', 'assets/Human_back.png');
  }

  create() {
    // Transition to intro scene
    this.scene.start('IntroScene');
  }
}
