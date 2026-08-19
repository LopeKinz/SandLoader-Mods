# Ender Dragon Boss

SandLoader mod for Sandustry.

## Features

- Animated original dragon boss rendered in-game.
- 1,200 HP boss bar.
- Left-click the dragon to deal 25 damage per hit.
- The dragon moves around the screen and attacks periodically.
- Dragon attacks spawn Sandustry Fire/Flame cells around the player's world position.
- On death the mod credits exactly **100,000 Gold** to the live Sandustry save state.
- A small cosmetic shower of Gold cells is spawned near the player after the kill.
- The save is marked as using mods through `store.integrity.modsUsed`.
- No Node.js, filesystem, network, or external dependencies.

## Spawn behavior

The dragon spawns automatically a few seconds after the game becomes ready.

You can also use the SandLoader console:

- `dragon spawn`
- `dragon status`
- `dragon despawn`

## Install

1. Open Sandustry.
2. Open **Main menu -> SandLoader Mods -> Install from ZIP**.
3. Select `sandustry-ender-dragon.zip`.
4. Restart the game.

## Gold reward

Sandustry resources are not guaranteed to have one fixed storage shape. Gold may be a plain number or an object with counters such as `available`, `found`, `amount`, or `count`. The mod detects the live shape and increments the writable Gold counters by 100,000.

## Assets

This mod does not redistribute Minecraft/Mojang textures, models, sounds, or other assets. The dragon graphic is drawn procedurally by this mod.
