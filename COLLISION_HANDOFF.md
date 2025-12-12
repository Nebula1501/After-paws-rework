# Collision System Handoff Document

## Summary

The owner (human NPC) has collision issues - walks through tables, walls, washing machines, etc. Work was started to fix this but requires game-specific position data to complete.

---

## What Was Done

### 1. Fixed Movement System (COMPLETED)

**Problem:** Owner movement used Phaser tweens which bypass physics collision detection.

**Solution:** Replaced tween-based movement with physics-based velocity movement.

**Files Changed:**

#### `src/scenes/HouseScene.js`

Added new properties (lines 219-222):
```javascript
this.ownerTarget = null;
this.ownerMoveCallback = null;
this.ownerSpeed = 100;
```

Replaced `moveOwnerToLocation()` method - now sets target instead of creating tween:
```javascript
moveOwnerToLocation(x, y, onComplete) {
  this.ownerState = 'walking';
  this.ownerTarget = { x, y };
  this.ownerMoveCallback = onComplete;
}
```

Added `updateOwnerMovement()` method (lines 307-353):
- Called every frame in update loop
- Calculates angle to target using `Phaser.Math.Angle.Between()`
- Sets velocity using physics system (respects collisions)
- Updates sprite direction based on movement
- Triggers callback when owner arrives within threshold (10px)

Added `stopOwnerMovement()` method (lines 355-360):
- Cleanly stops owner, clears target and callback
- Used by DistractionManager when owner gets distracted

Updated `update()` loop to call `updateOwnerMovement()` each frame.

#### `src/systems/DistractionManager.js`

Updated `triggerDistraction()` (line 52-54):
- Now uses `this.scene.stopOwnerMovement()` instead of manual tween kill

---

### 2. Identified Collider Problem (NOT YET FIXED)

**Problem:** The furniture colliders were:
- Placed at hardcoded coordinates that don't match actual sprite positions
- All sized 500x500 regardless of actual furniture size
- Completely misaligned with visual furniture

**Current State:** All placeholder colliders have been REMOVED. The `furnitureColliders` group is empty:

```javascript
// Furniture colliders - empty for now, need proper positions
this.furnitureColliders = this.physics.add.staticGroup();

// TODO: Add colliders based on actual sprite positions
// For now, removed all placeholder colliders since they were incorrectly positioned
```

---

## Understanding the Asset System

### How Assets Are Loaded

All sprites are loaded at `(0, 0)` with `setOrigin(0, 0)`:

```javascript
this.bedroomItems = this.add.image(0, 0, 'bedroomItems').setOrigin(0, 0).setDepth(20);
this.fridge = this.add.image(0, 0, 'fridge').setOrigin(0, 0).setDepth(22);
this.chips = this.add.image(0, 0, 'chips').setOrigin(0, 0).setDepth(30);
```

### Asset Types

According to the user, all assets are **small individual sprites** (not full canvas layers), and they display in the correct positions. This means the PNGs likely have:
- Transparent padding baked in
- Or are positioned correctly within a larger canvas export from Photoshop

### Asset Files (in `assets/` folder)

**Room furniture layers:**
- `bedroom items.png` (287KB)
- `kitchen Items.png` (312KB)
- `living_room items.png` (699KB)
- `bathroom items.png` (129KB)

**Individual props:**
- `books.png`, `boxes.png`, `broom.png`, `chips.png`, `clothes.png`
- `plates.png`, `utensils.png`, `stand.png`, `cat items.png`
- `FRIDGE.png`, `bedsheet_messy.png`, `bedsheet_neat.png`

**Environment:**
- `floor_wood.png`, `Bathroom Tile.png`, `walls.png`
- `dirt splashes.png`, `livingroom dirt.png`, `Dirty Table Splotches.png`

---

## What Needs To Be Done

### Step 1: Get Actual Furniture Positions

The game has a debug overlay showing cat coordinates (green text, top-left). Use this to find the actual boundaries of furniture that needs collision:

**Priority items for collision:**
- Tables (living room, kitchen)
- Washing machines
- Bathtub
- Bed
- Stove/counters
- Walls (interior walls between rooms)

**Format needed:**
```
Table: x1=1200, y1=900, x2=1400, y2=1100 (width=200, height=200)
Washing machine: x1=50, y1=1000, x2=150, y2=1150 (width=100, height=150)
```

### Step 2: Add Colliders

Once positions are known, add colliders in `createFurniture()`:

```javascript
// Example: Table collider
this.furnitureColliders.create(x + width/2, y + height/2, null)
  .setSize(width, height)
  .setVisible(false)
  .refreshBody();
```

**Note:** `create()` positions at center point, so add half width/height to top-left coordinates.

### Step 3: Consider Depth/Layering

Currently owner is at depth 50. If owner should appear BEHIND furniture when walking past:
- Furniture at depth > 50 will render on top of owner
- May need dynamic depth based on Y position for proper sorting

---

## File Locations

| File | Purpose |
|------|---------|
| `src/scenes/HouseScene.js` | Main game scene, colliders defined in `createFurniture()` |
| `src/scenes/PreloadScene.js` | Asset loading |
| `src/systems/InteractionManager.js` | E-key task interactions |
| `src/systems/DistractionManager.js` | Grief episode system |
| `src/systems/TaskManager.js` | 8 cleaning tasks |
| `src/systems/EndingManager.js` | 6-phase ending sequence |

---

## Current Collision Setup

### Wall Colliders (Working)
```javascript
// In createWalls() - world boundary only
this.wallColliders = this.physics.add.staticGroup();
this.wallColliders.create(1180, 0, null).setSize(2360, 20);    // Top
this.wallColliders.create(1180, 1640, null).setSize(2360, 20); // Bottom
this.wallColliders.create(0, 820, null).setSize(20, 1640);     // Left
this.wallColliders.create(2360, 820, null).setSize(20, 1640);  // Right
```

### Furniture Colliders (Empty - Needs Work)
```javascript
// In createFurniture()
this.furnitureColliders = this.physics.add.staticGroup();
// TODO: Add actual colliders here
```

### Collision Registration
```javascript
// In createCharacters()
this.physics.add.collider(this.owner, this.wallColliders);
this.physics.add.collider(this.owner, this.furnitureColliders);
```

---

## Debug Features

### Coordinate Display
- Green text (top-left): Cat position
- Orange text: Owner position
- Updates in real-time

### Grid Overlay
- Green lines every 100px
- Red lines every 500px
- Helps identify positions

### Physics Debug
In `main.js`:
```javascript
physics: {
  default: 'arcade',
  arcade: {
    gravity: { y: 0 },
    debug: true  // Shows collision bodies
  }
}
```

---

## Testing

1. Run game (open `index.html`)
2. Skip intro with SPACE
3. Move cat with WASD/arrows
4. Press E near task items to trigger owner movement
5. Watch owner - should now use physics movement but will pass through furniture until colliders are added

---

## Quick Reference: Adding a Collider

```javascript
// In createFurniture() method:

// For a piece of furniture at top-left (100, 200) with size 150x100:
this.furnitureColliders.create(
  100 + 75,   // x center = x + width/2
  200 + 50,   // y center = y + height/2
  null
).setSize(150, 100).setVisible(false).refreshBody();
```

---

## Questions for Next Session

1. Can you provide actual pixel coordinates for furniture boundaries?
2. Should interior walls have collision? (Currently only world edges do)
3. Do you want owner to walk BEHIND certain furniture (depth sorting)?
4. Is pathfinding needed, or just direct collision blocking?
