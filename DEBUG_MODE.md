# Debug Mode Guide

## What Was Fixed

### **1. Canvas Size**
- ✅ World bounds updated to match your Photoshop canvas: **2360x1640 pixels**
- ✅ Camera bounds updated to match world size

### **2. Floor Layering**
- ✅ Fixed layering order:
  - **Depth 0**: Bathroom Tile (bottom layer)
  - **Depth 1**: Floor Wood (above bathroom tile)
  - **Depth 10**: Walls
  - **Depth 20-22**: Furniture and fridge
  - **Depth 25-30**: Props and dirt

### **3. Debug Features Enabled**

## Debug Overlay Features

### **Grid System**
- **Green lines** (thin): Every 100 pixels
- **Red lines** (thick): Every 500 pixels
- Grid covers entire 2360x1640 world

### **Coordinate Display**
Three info boxes appear in top-left corner (fixed to camera):

1. **Cat Position** (Green)
   - Shows: `Cat: (X, Y)`
   - Updates in real-time as you move

2. **Owner Position** (Orange)
   - Shows: `Owner: (X, Y)`
   - Tracks NPC position

3. **World Info** (White)
   - Shows: `World: 2360x1640 | Canvas from Photoshop`

### **Physics Debug**
- Collision boxes visible (green/blue outlines)
- Shows wall colliders and furniture colliders
- Helps verify collision placement

---

## How to Use Debug Mode

### **1. Run the Game**
Open `index.html` in your browser

### **2. Navigate the Map**
- Use **Arrow Keys** or **WASD** to move the cat
- Watch the coordinate display update in real-time
- The grid helps you identify exact positions

### **3. Find Asset Positions**
To tell me where an asset should be placed:
1. Move the cat to the asset location
2. Read the coordinates from the display
3. Tell me: "The [asset name] is at (X, Y)"

Example: *"The fridge is at (550, 450)"*

### **4. Check Owner Position**
- The owner starts in the bedroom
- Orange coordinate display shows owner location
- If owner is missing/wrong position, tell me the coordinates

---

## Common Issues to Check

### **Missing Human Asset**
**Status**: Human may not be visible at start
- Move cat around the map to find if owner spawned
- Check orange "Owner:" coordinates
- If coordinates show but no sprite visible:
  - Human sprite may be behind other layers
  - Position may be wrong

**Current owner spawn**: `(180, 120)` - bedroom near bed

### **Fridge Position**
**Current fridge settings**:
- **Sprite position**: `(0, 0)` with origin `(0, 0)`
- **Interaction center**: `(480, 420)`
- **Interaction radius**: 60 pixels

If fridge appears wrong, tell me the correct coordinates.

---

## What to Report

When you test the game, please tell me:

1. **Cat spawn location** - coordinates shown at start
2. **Owner location** - is the orange coordinate showing? If yes, where?
3. **Owner visible?** - Can you see the human sprite?
4. **Fridge location** - Where does the fridge sprite appear?
5. **Any misaligned assets** - Note their grid positions

### **Example Report Format**
```
Cat starts at: (550, 500) ✓
Owner coordinates: (180, 120)
Owner visible: NO ✗
Fridge appears at: Top-left corner (approximately 50, 50)
Floor wood covers bathroom tile: YES ✓
```

---

## Turning Off Debug Mode (Later)

When you're ready to disable debug features:

### **1. Hide Grid and Coordinates**
In `HouseScene.js`, line 35, comment out:
```javascript
// this.createDebugOverlay();
```

### **2. Hide Collision Boxes**
In `main.js`, line 19, change:
```javascript
debug: false  // was: debug: true
```

---

## Current Asset Loading Status

✅ All assets loading from correct paths
✅ Resized cat and human sprites will load
✅ Separate fridge sprite will load
✅ Kitchen items (without fridge) will load

**Just need coordinate adjustments based on your feedback!**

---

**Test the game and report back what you see!** 🔍🎮
