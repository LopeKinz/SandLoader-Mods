# SandLoader Mods

Community mods for **Sandustry**, built for **SandLoader**.

## Mods

### Gas Pipes

Extends Sandustry's existing pump/pipe/vent network so it can transport gaseous elements in addition to the vanilla water path.

- Uses Sandustry's live matter classification for gases
- Reuses vanilla Pump, Pipe and Liquid Vent structures
- Preserves vanilla water transport when no gas is moved
- Fails safely if required bundle patch anchors no longer match

Source: `mods/gas-pipes/`

Ready-to-install ZIP: `releases/sandustry-gas-pipes-v1.0.0.zip`

### Ender Dragon Boss

Adds an original dragon boss inspired by the Ender Dragon concept without redistributing Minecraft/Mojang assets.

- 1,200 HP boss
- Animated flight and boss bar
- Fire attacks
- Left-click combat
- Defeating the boss awards exactly **100,000 Gold**
- Includes a cosmetic Gold shower
- Pure renderer mod with no filesystem or network access

Source: `mods/ender-dragon/`

Ready-to-install ZIP: `releases/sandustry-ender-dragon-v1.0.0.zip`

## Installation

1. Install SandLoader for Sandustry.
2. Open Sandustry.
3. Open **SandLoader Mods -> Install from ZIP**.
4. Select one of the ZIP files from `releases/`.
5. Restart Sandustry.

## Compatibility

These mods target the current SandLoader/Sandustry APIs and implementation available when they were built. Game updates can require compatibility updates, especially for mods that patch the game bundle.

## Notes

The Ender Dragon Boss mod does **not** include or redistribute Minecraft/Mojang textures, models, sounds, or other copyrighted game assets. Its dragon is rendered procedurally by the mod.
