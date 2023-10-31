import * as ui from '@minecraft/server-ui';

export let memory = {// sets default values
    block_cap: 100,
    use_tag: false,
    tagId: 'useBlk',
    show_counter: true,
    treecapitator: true,
    vein_miner: true,
    crop_harvester: true
};

// This function creates and shows a modal form to the player
export function showExampleForm(player, DB) {
    const storedMemory = DB.getArray('blkc_mem', 'memory');
    if (storedMemory) {
        memory = {// sets default values
            block_cap: storedMemory.block_cap,
            use_tag: storedMemory.use_tag,
            tagId: storedMemory.tagId,
            show_counter: storedMemory.show_counter,
            treecapitator: storedMemory.treecapitator,
            vein_miner: storedMemory.vein_miner,
            crop_harvester: storedMemory.crop_harvester
        }
    }

    // Creating a new modal form
    const form = new ui.ModalFormData();

    // Setting the title of the form
    form.title("Convenient Tools Settings");

    // Adding a slider element to the form
    // Parameters: label, minimum value, maximum value, value per step, initial value
    form.slider("§2§lBlock Break Cap§r \n§4Over 100 may cause crashing.§r\n", 1, 200, 1, memory.block_cap);

    //Use tag
    form.toggle("§4§lRequire Tags?", memory.use_tag);
    form.textField("Tag ID", "", memory.tagId);

    //Addon Settings
    form.toggle("§5§lShow Break Counter", memory.show_counter);
    form.toggle("§2§lTreecapitator", memory.treecapitator);
    form.toggle("§3§lVein Miner", memory.vein_miner);
    form.toggle("§6§lCrop Harvester", memory.crop_harvester);

    form.show(player).then(response => {
        // Checking if the player canceled the form
        if (response.canceled) {
            player.sendMessage("You canceled the form.");
            return;
        }

        // Retrieving the player's responses
        const blockCap = response.formValues[0];
        const useTags = response.formValues[1];
        const tagId = response.formValues[2];
        const showCounter = response.formValues[3];
        const treeCapitator = response.formValues[4];
        const veinMiner = response.formValues[5];
        const cropHarvester = response.formValues[6];

        memory = {
            block_cap: blockCap,
            use_tag: useTags,
            tagId: tagId,
            show_counter: showCounter,
            treecapitator: treeCapitator,
            vein_miner: veinMiner,
            crop_harvester: cropHarvester
        }
        DB.newDB('blkc_mem')
        DB.setArray('blkc_mem', 'memory',memory )
    });
}