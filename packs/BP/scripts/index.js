import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui'
const overworld = mc.world.getDimension("overworld");
let totalItemDamage = 0;
let initDelay = false;

mc.system.runInterval(() => {
    if (initDelay) {
        let players = mc.world.getAllPlayers();
        players.forEach(uiManager);
    }
    
}, 0);

mc.world.afterEvents.worldInitialize.subscribe(e => {
    let def = new mc.DynamicPropertiesDefinition();
    def.defineBoolean("initCheck"   , false);
    def.defineBoolean("requireTags" , false);
    e.propertyRegistry.registerWorldDynamicProperties(def);
    initDelay = true;
    return initDelay;

});

mc.system.runTimeout(() => {
    try {
        let initCheck = mc.world.getDynamicProperty("initCheck");
        if (!initCheck){
            let players = mc.world.getAllPlayers();
            players.forEach(forceUI);  
        }
        mc.world.setDynamicProperty("initCheck", true);
    } catch (e) {console.warn("Error: " + e);}
}, 200);

mc.world.afterEvents.itemUse.subscribe((event) => {
    try{
        const player = event.source;
        let container = player.getComponent("inventory").container;
        let item = container.getItem(player.selectedSlot);
        let itemId = item.typeId;
        let playerLocation = player.location;
        let requireTags = mc.world.getDynamicProperty("requireTags");
        let ignoreTagCheck;
        if (!requireTags) {ignoreTagCheck = true;} else {ignoreTagCheck = false;}
        if (item != undefined && player.hasTag('chop:true') || ignoreTagCheck) {
            if((itemId.endsWith('_seeds') || itemId.endsWith('_pod') || itemId == 'minecraft:carrot' || itemId == 'minecraft:potato' || item.hasTag('is_seed')) && player.isSneaking) {
                plantSeedCommands(player, playerLocation, 8, itemId);
            }
        }
        
    }
    catch (e){console.warn("Error: " + e);}
    
})

mc.world.afterEvents.playerBreakBlock.subscribe((event) => {
    try {
        const { brokenBlockPermutation, player } = event;
        const block = brokenBlockPermutation;
        const blockId = block.type.id;
        const blockLocation = event.block.location;
        let container = player.getComponent("inventory").container;
        let item = container.getItem(player.selectedSlot);
        const enchantments = item?.getComponent(mc.ItemEnchantsComponent.componentId)?.enchantments;
        let requireTags = mc.world.getDynamicProperty("requireTags");
        let ignoreTagCheck;
        if (!requireTags) {ignoreTagCheck = true;} else {ignoreTagCheck = false;}
    
        if (item != undefined && (player.hasTag('chop:true') || ignoreTagCheck)) {
            let axeTag = item.getTags();
            let pickaxeTag = item.getTags();
            let shearsTag = item.getTags();
            let hoeTag = item.getTags();
            let blockTag = block.getTags();
            let blockState = block.getAllStates();
            
            if ((block.hasTag('log') || blockId.includes('_log') || blockId.includes('_roots')) && axeTag.some(tag => tag.includes('is_axe')) && player.isSneaking) {
                breakVerticalCommands(player, blockLocation, blockId, item);
            }
            if (blockId.endsWith('_ore') && pickaxeTag.some(tag => tag.includes('is_pickaxe')) && player.isSneaking) {
                breakCubeCommands(player, blockLocation, 4, blockId, item, enchantments);
            }
            if ((blockId.includes('leaves') || blockTag.includes('is_leaf') || blockTag.includes('leaves')) && player.isSneaking && (item.typeId == 'minecraft:shears' || shearsTag.some(tag => tag.includes('is_shear')))) {
                breakCubeCommands(player, blockLocation, 4, blockId, item, enchantments);
            }
            if (blockTag.some(tag => tag.includes('crop')) && block.withState('growth', 7) && hoeTag.some(tag => tag.includes('is_hoe')) && player.isSneaking) {
                breakPlaneCommands(player, blockLocation, 8, blockId, item);
            }
            if (item.typeId == 'minecraft:stick' && player.hasTag('debug')) {
                const formattedBlockState = Object.entries(blockState).map(([key, value]) => `${key}: ${value}`).join(', ');
                player.sendMessage(`§2ID: ${blockId}\n§3Tags: ${blockTag}\n§5States: ${formattedBlockState}\n§6ItemID: ${item.typeId}`);
            }
        }
    }
    catch (e) {console.warn("Error: " + e);}

});

function breakVerticalCommands(player, blockLocation, blockId, item) {
    totalItemDamage = 0; 
    for (let i = 1; i <= 32; i++) {
        let location = { x: blockLocation.x, y: blockLocation.y + i, z: blockLocation.z };
        let checkBlock = overworld.getBlock(location);
        
        if (checkBlock.hasTag('log') || checkBlock.type.id.includes('_log') || checkBlock.type.id.includes('_roots')) {
            totalItemDamage++; 
            player.runCommandAsync(`execute as @s at @s positioned ${blockLocation.x} ${blockLocation.y + i} ${blockLocation.z} if block ~ ~ ~ ${blockId} run setblock ~ ~ ~ air destroy`);
        }
        
        if (checkBlock.typeId != blockId) {
            break;
        } 
    }
    
    if (totalItemDamage > 0) {
        damageItem(item, player, totalItemDamage);
    }
}


function breakCubeCommands(player, center, cubeSize, blockId, item, enchantments) {
    const halfSize = Math.floor(cubeSize / 2);
    totalItemDamage = 0; 
    for (let xOffset = -halfSize; xOffset <= halfSize; xOffset++) {
        for (let yOffset = -halfSize; yOffset <= halfSize; yOffset++) {
            for (let zOffset = -halfSize; zOffset <= halfSize; zOffset++) {
                const x = center.x + xOffset;
                const y = center.y + yOffset;
                const z = center.z + zOffset;
                let location = { x: x, y: y, z: z };
                let checkBlock = overworld.getBlock(location);
                if (item.typeId == 'minecraft:shears' && enchantments.hasEnchantment('silk_touch') && checkBlock.typeId.includes('leaves')) {
                    let loot = new mc.ItemStack(mc.MinecraftItemTypes.leaves, 1);
                    overworld.spawnItem(loot, location);
                }
                if (checkBlock.typeId.includes(blockId)) {
                    totalItemDamage++; 
                    player.runCommandAsync(`execute as @s at @s positioned ${x} ${y} ${z} if block ~ ~ ~ ${blockId} run setblock ~ ~ ~ air destroy`);
                }
            }
        }
    }
    if (totalItemDamage > 0) {
        damageItem(item, player, totalItemDamage);
    }
}

function breakPlaneCommands(player, center, planeSize, blockId, item) {
    const halfSize = Math.floor(planeSize / 2);
    const y = center.y;
    totalItemDamage = 0; 
    for (let xOffset = -halfSize; xOffset <= halfSize; xOffset++) {
        for (let zOffset = -halfSize; zOffset <= halfSize; zOffset++) {
            const x = center.x + xOffset;
            const z = center.z + zOffset;
            let location = { x: x, y: y, z: z };
            let checkBlock = overworld.getBlock(location);
            if (checkBlock.hasTag('minecraft:crop')) {
                totalItemDamage++; 
                player.runCommandAsync(`execute as @s at @s positioned ${x} ${y} ${z} if block ~ ~ ~ ${blockId}["growth" = 7] run setblock ~ ~ ~ air destroy`);
            }
        }
    }
    if (totalItemDamage > 0) {
        damageItem(item, player, totalItemDamage);
    }
}

function plantSeedCommands(player, center, planeSize, itemId) {
    const halfSize = Math.floor(planeSize / 2);
    const y = center.y;
    for (let xOffset = -halfSize; xOffset <= halfSize; xOffset++) {
        for (let zOffset = -halfSize; zOffset <= halfSize; zOffset++) {
            const x = center.x + xOffset;
            const z = center.z + zOffset;
            let location = { x: x, y: y, z: z };
            let checkBlock = overworld.getBlock(location);
            let setBlockId =
                itemId.includes('wheat') || itemId.includes('beetroot') ? itemId.replace('_seeds', '') :
                itemId.includes('carrot') ? itemId + 's' :
                itemId.includes('potato') ? itemId + 'es' :
                itemId.includes('melon') || itemId.includes('pumpkin') ? itemId.replace('_seeds', '_stem') :
                itemId.replace('_seeds', '');

            if (checkBlock.typeId == 'minecraft:farmland') { 
                player.runCommandAsync(`execute as @s[hasitem={item=${itemId.replace('minecraft:', '')},quantity=1..}] at @s positioned ${x} ${y} ${z} if block ~ ~ ~ farmland["moisturized_amount" = 7] if block ~ ~1 ~ air run clear @s ${itemId} 0 1`);
                player.runCommandAsync(`execute as @s[hasitem={item=${itemId.replace('minecraft:', '')},quantity=1..}] at @s positioned ${x} ${y} ${z} if block ~ ~ ~ farmland["moisturized_amount" = 7] if block ~ ~1 ~ air run setblock ~ ~1 ~ ${setBlockId}`);

            }
        }
    }
}

function damageItem(item, player, totalItemDamage){
    let currentDamage = item.getComponent("minecraft:durability").damage;
    let maxDurability = item.getComponent("minecraft:durability").maxDurability;
    currentDamage += totalItemDamage;
    if (currentDamage > maxDurability) {currentDamage = maxDurability}
    item.getComponent("minecraft:durability").damage + currentDamage;
    if (player.hasTag('debug')){
        player.sendMessage(`currentDamage: ${currentDamage} | totalItemDamage: ${totalItemDamage} | Item durability: ${maxDurability}`);
    }
}

function forceUI(player){player.addTag('show.config')}

function configWindow() {
    let requireTags = mc.world.getDynamicProperty("requireTags");
    let reqButton;
    let reqText;
    if (requireTags) {reqButton = '§3Require Tags : §2On'} else {reqButton = '§3Require Tags : §4Off'};
    if (requireTags) {reqText = `${reqButton} \n§6Apply the tag §2chop:true §6to enable addon effects to players`} else {reqText = reqButton};
    return new ui.ActionFormData()
      .title("Blocka-Chopa")
      .body(`§6Addon Settings\n\n${reqText}`)
      .button(reqButton, "textures/items/name_tag")
      .button("§5Confirm Settings", "textures/items/ruby")
}
function confirmWindow() {
    let reqText;
    let requireTags = mc.world.getDynamicProperty("requireTags");
    if (requireTags) {reqText = `§6Apply the tag §2chop:true §6to enable addon effects to players`} else {reqText = ""};

    return new ui.ActionFormData()
      .title("Blocka-Chopa")
      .body(`§3You can change these settings at any time with the command: §2/tag @s add show.config \n\n${reqText}`)
      .button("§2okay", "textures/items/ruby")
}

function uiManager(player) {
    const showConfigWindow = configWindow();
    const showConfirmWindow = confirmWindow();
    if (player.hasTag("show.config")) {
        player.removeTag("show.config");
        showConfigWindow.show(player).then((response) => {
            if (response.selection === 0) {
                let requireTags = mc.world.getDynamicProperty("requireTags");
                if (requireTags) {
                    mc.world.setDynamicProperty("requireTags", false);
                } else {
                    mc.world.setDynamicProperty("requireTags", true);
                }
                player.addTag("show.config");
                return -1;
            }
            if (response.selection === 1) {
                player.addTag("show.confirm");
                return -1;
            }
        })
    }
    if (player.hasTag("show.confirm")) {
        player.removeTag("show.confirm");
        showConfirmWindow.show(player).then((response) => {
            if (response.selection === 0) {

            }
            
        })
    }
}