import { world } from '@minecraft/server';
import { LDB } from './ldb';
const OVERWORLD = world.getDimension("overworld");
const DB = new LDB;

/**
* Retrieves data about the block that was broken.
* 
* @param {Object} event - The event object that contains information about the broken block.
* @returns {Object} An object containing information about the broken block, such as its ID, location, tags, states, and the player who broke it.
*/
export function getBlockData(event) {
    try {
        let tags = event.brokenBlockPermutation.getTags();
        let states = event.brokenBlockPermutation.getAllStates()
        const blockData = {
            source: event.player,
            block: event.brokenBlockPermutation,
            id:event.brokenBlockPermutation.type.id,
            location:event.block.location,
            tags:tags,
            states:states
        }
        return blockData;
    }
    catch (e) {console.warn("Error: " + e);}
}

/**
* Checks the type of the broken block and determines if it is valid based on its tags and ID.
* 
* @param {Object} blockData - An object containing information about the broken block.
* @returns {Object} An object containing two properties: isValid (a boolean indicating if the block is valid) and type (a string indicating the type of the block).
*/
export function checkBlockType(blockData) {
    let isValid = false;
    let type;

    if (blockData.tags.includes('ignore_blkc')) return;

    if (blockData.tags.includes('log') || blockData.id.includes('log')) {
        isValid = true;
        type = 'log';
    } else if (blockData.tags.includes('mushroom') || blockData.id.includes('mushroom')) {
        isValid = true;
        type = 'mushroom';
    } else if (blockData.tags.includes('roots') || blockData.id.includes('roots')) {
        isValid = true;
        type = 'roots';
    } else if (blockData.tags.includes('stem') || blockData.id.includes('stem')) {
        isValid = true;
        type = 'stem';
    } else if (blockData.tags.includes('wart') || blockData.id.includes('wart')) {
        isValid = true;
        type = 'wart';
    }
    else if (blockData.tags.includes('ore') || blockData.id.includes('ore')) {
        isValid = true;
        type = 'ore';
    } else if (blockData.tags.includes('leaves') || blockData.id.includes('leaves')) {
        isValid = true;
        type = 'leaves';
    } else if (blockData.tags.includes('minecraft:crop') || blockData.tags.includes('crop')) {
        const growthState = blockData.block.getState('growth');
        if (growthState === 7) {
            isValid = true;
            type = 'crop';
        }
    }

    return { isValid, type }
}

/**
* Retrieves data about the item that the player is currently holding.
* 
* @param {Object} blockData - An object containing information about the broken block.
* @returns {Object} An object containing information about the held item, such as its ID and tags.
*/
export function getItemData(blockData) {
    const player = blockData.source;
    const container = player.getComponent("inventory").container;
    const item = container.getItem(player.selectedSlot);
    if (item === undefined || null) return { id: 'undefined', tags: [] }
    const id = item.typeId;
    const tags = item.getTags();
    return {
        id, tags
    }
}

/**
* Checks the type of the item that the player is holding and determines if it is valid based on its ID and tags.
* 
* @param {Object} itemData - An object containing information about the held item.
* @returns {Object} An object containing two properties: isValid (a boolean indicating if the item is valid) and type (a string indicating the type of the item).
*/
export function checkItemType(itemData) {
    let isValid = false;
    let type;
    if (itemData.id.includes('axe') || itemData.tags.includes('is_axe')) {
        isValid = true;
        type = 'axe';
    }
    if (itemData.id.includes('pickaxe') || itemData.tags.includes('is_pickaxe')) {
        isValid = true;
        type = 'pickaxe';
    }
    if (itemData.id.includes('shovel') || itemData.tags.includes('is_shovel')) {
        isValid = true;
        type = 'shovel';
    }
    if (itemData.id.includes('_hoe') || itemData.tags.includes('is_hoe')) {
        isValid = true;
        type = 'hoe';
    }
    if (itemData.id.includes('shears') || itemData.tags.includes('shear')) {
        isValid = true;
        type = 'shears';
    }
    return { isValid, type }
}

/**
* Finds all neighboring blocks of the same type as the broken block.
* 
* @param {Object} blockData - An object containing information about the broken block.
* @param {Object} isValidBlock - An object containing information about the validity and type of the block.
* @returns {Array} An array of objects, each object representing a neighboring block with its ID, location, and the direction relative to the original block.
*/
export function getBlockNeighbours(blockData, isValidBlock, mem) {
    //let mem = DB.getArray('blkc_mem', 'memory');
    const maxBlockBreak = mem.block_cap;
    let neighbours = [];
    let origin = { x: blockData.location.x, y: blockData.location.y, z: blockData.location.z };
    const visitedLocations = new Set();
    visitedLocations.add(`${origin.x},${origin.y},${origin.z}`);

    function findNeighbours(loc) {

        const offsets = [
            { offset: { x: 0, y: -1, z: 0 }, direction: 'down' },
            { offset: { x: 0, y: 1, z: 0 }, direction: 'up' },
            { offset: { x: 0, y: 0, z: -1 }, direction: 'north' },
            { offset: { x: 0, y: 0, z: 1 }, direction: 'south' },
            { offset: { x: -1, y: 0, z: 0 }, direction: 'west' },
            { offset: { x: 1, y: 0, z: 0 }, direction: 'east' },
        ];

        for (const { offset, direction } of offsets) {
            if (neighbours.length >= maxBlockBreak) break;
            const blockX = loc.x + offset.x;
            const blockY = loc.y + offset.y;
            const blockZ = loc.z + offset.z;
            const key = `${blockX},${blockY},${blockZ}`;

            if (!visitedLocations.has(key)) {
                visitedLocations.add(key);
                const block = OVERWORLD.getBlock({ x: blockX, y: blockY, z: blockZ });

                if (isValidBlock.type === 'crop') {
                    const growthState = block.permutation.getState('growth');
                    if (growthState < 7) break;
                }

                if (block.type.id === blockData.id) {
                    const neighbour = {
                        id: block.type.id,
                        location: { x: blockX, y: blockY, z: blockZ },
                        direction: direction
                    };
                    neighbours.push(neighbour);
                    findNeighbours(neighbour.location);
                }
            }
        }
    }

    findNeighbours(origin);

    return neighbours;
}