import { world, ItemStack } from '@minecraft/server';
import { LDB } from './ldb';
const OVERWORLD = world.getDimension("overworld");

const DB = new LDB;

/**
* Calculates the number of blocks in the array.
*
* @param {Array} neighbours - An array of objects, each representing a neighboring block.
* @returns {number} The number of blocks in the array.
*/
export function blockCount(neighbours) {
    return neighbours.length;
}

/**
* Cleans and formats a string representing a block or item ID.
*
* @param {string} str - The string to clean and format.
* @returns {string} The cleaned and formatted string.
*/
export function cleanString(str) {
    const parts = str.split(':');
    const idPart = parts.length > 1 ? parts[1] : str;
    return idPart.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

/**
* Displays a message on the player's action bar indicating the number of blocks broken and the type of block.
*
* @param {Object} blockData - An object containing information about the broken block.
* @param {number} count - The number of blocks broken.
*/
export function printActionbar(blockData, count) {
    const storedMemory = DB.getArray('blkc_mem', 'memory');
    if (!storedMemory.show_counter) return;
    const id = blockData.id;
    const cleanedId = cleanString(id);
    blockData.source.onScreenDisplay.setActionBar(`§4Broke §6${count} §2${cleanedId}s`);
}

/**
* Runs a Minecraft command to destroy and replace all the neighboring blocks with air.
*
* @param {Object} blockData - An object containing information about the broken block.
* @param {Array} neighbours - An array of objects, each representing a neighboring block.
*/
export async function runCommand(blockData, neighbours) {
    for (const { location } of neighbours) {
        const { x, y, z } = location;
        try {
            await blockData.source.runCommandAsync(`execute as @s at @s positioned ${x} ${y} ${z} run setblock ~ ~ ~ air destroy`);
            //if leaves spawn item
            if (blockData.id.includes('leaves')) {
                let loot = new ItemStack(`${blockData.id}`, 1);
                await OVERWORLD.spawnItem(loot, location);
            }
        } catch (e) {
            console.warn(`Failed to run command at ${x}, ${y}, ${z}:` + e);
        }
    }
}