# Gas Pipes

SandLoader mod for Sandustry that lets gas cells travel through the existing Pump -> Pipe -> Liquid Vent network.

## What it does

- Detects gases through Sandustry's own `matterType == Gas` logic instead of a hard-coded gas list.
- Moves each gas cell from the pump's inner intake cells to free cells inside connected Liquid Vents.
- Preserves the exact gas element type while transporting it.
- Leaves Sandustry's original water-pump path untouched when no gas is present.
- Gives gas priority for a tick when both gas and water are sitting in the same pump, avoiding two queued writes to the same vent cell.
- Does not use filesystem, network, child processes, or external packages. `main.js` only contributes in-memory SandLoader patches.

## Install

1. Open Sandustry.
2. Open **Main menu -> SandLoader Mods -> Install from ZIP**.
3. Select `sandustry-gas-pipes.zip`.
4. Restart the game.

## Use

Build the normal Sandustry network:

`gas -> Pump -> Pipe(s) -> Liquid Vent`

Put gas into the pump's inner intake area. If the connected vent has free output cells, the pump removes up to that many gas cells and recreates the same gas types at the vent.

## Compatibility

Built against the current SandLoader patch API and the Sandustry 0.5.4 bundle shape SandLoader is verified against. Every hook is required and has an exact match count; if Sandustry changes the relevant pump implementation, SandLoader should reject the patch and serve the original game bundle instead of applying a partial patch.

## Technical note

The mod uses Sandustry's internal matter-type checker, so elements registered as `Gas` can be handled without adding their names to this mod. Transport recreates the gas element at the vent using the same internal element constructor used by the vanilla water pump.
