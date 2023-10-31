import { blockCount, printActionbar, runCommand } from './helper';
import { world, system } from '@minecraft/server';
import { getBlockData, checkBlockType, getItemData, checkItemType , getBlockNeighbours } from './utils';
import { showExampleForm, memory } from './ui';
import { LDB } from './ldb';

const DB = new LDB;

system.runInterval(() => {
    const ALL_PLAYERS = world.getAllPlayers();
    ALL_PLAYERS.forEach(player => {
        if (player.hasTag('showUI')) {
            showExampleForm(player, DB);//passing memory to ui
            player.removeTag('showUI');
        }
    });
}, 0);

world.afterEvents.playerBreakBlock.subscribe((event) => {
    let mem = DB.getArray('blkc_mem', 'memory');
    if (!mem) mem = memory;
    
    const REQUIRE_TAG = mem.use_tag;
    const GLOBAL_TAG = mem.tagId;

    const blockData = getBlockData(event);
    const isValidBlock = checkBlockType(blockData);
    const itemData = getItemData(blockData);
    const isValidItem = checkItemType(itemData);

    if (REQUIRE_TAG) { 
        const hasTag = blockData.source.hasTag(GLOBAL_TAG)
        if (!hasTag) return;
    }

    if (!isValidItem.isValid || !isValidBlock.isValid || !blockData.source.isSneaking) return;

    const toolToBlockMap = {
        'axe': ['log', 'mushroom', 'roots', 'stem'],
        'pickaxe': 'ore',
        'shears': 'leaves',
        'hoe': ['crop', 'wart']
    };

    const validBlocks = toolToBlockMap[isValidItem.type];
    if ((isValidItem.type === 'axe' || isValidItem.type === 'shears') && !mem.treecapitator) return;
    if (isValidItem.type === 'pickaxe' && !mem.vein_miner) return;
    if (isValidItem.type === 'hoe' && !mem.crop_harvester) return;
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

system.afterEvents.scriptEventReceive.subscribe(event => cmdHandler(event));
function cmdHandler(event) {
    const player = event.sourceEntity;

    switch (event.id) {
        case "blkc:settings":
            showExampleForm(player, DB);
            break;
        default:
            break;
    }
}