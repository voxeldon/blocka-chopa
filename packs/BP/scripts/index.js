import { blockCount, printActionbar, runCommand } from './helper';
import { world } from '@minecraft/server';
import { getBlockData, checkBlockType, getItemData, checkItemType , getBlockNeighbours } from './utils';

const REQUIRE_TAG = false;
const GLOBAL_TAG = 'useBlk'

world.afterEvents.playerBreakBlock.subscribe((event) => {
    const blockData = getBlockData(event);
    const isValidBlock = checkBlockType(blockData);
    const itemData = getItemData(blockData);
    const isValidItem = checkItemType(itemData);

    if (REQUIRE_TAG) { 
        const hasTag = blockData.source.hasTag(GLOBAL_TAG)
        if (!hasTag) return;
    }

    if (!isValidItem.isValid || !isValidBlock.isValid) return;

    const toolToBlockMap = {
        'axe': ['log', 'mushroom', 'roots'],
        'pickaxe': 'ore',
        'shears': 'leaves',
        'hoe': 'crop'
    };

    const validBlocks = toolToBlockMap[isValidItem.type];
    if (Array.isArray(validBlocks) ? validBlocks.includes(isValidBlock.type) : validBlocks === isValidBlock.type) {
        handleBlockInteraction(blockData, itemData, isValidBlock);
    }
});

function handleBlockInteraction(blockData, itemData, blockType) {
    try {
        const neighbours = getBlockNeighbours(blockData, blockType);
        const count = blockCount(neighbours);
        runCommand(blockData, neighbours);
        printActionbar(blockData, count);
    } catch (e) {
        console.warn(`Error @handleBlockInteraction (${blockType.type}): ${e}`);
    }
}
