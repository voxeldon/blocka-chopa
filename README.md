# Blocka-Chopa
My take on the classic mods Lumberjack/Treecapitator & Veinminer with some new feature additions.

## Features

- **Chop down entire trees.**
- **Mine entire ore veins.**
- **Shear scores of leaves.**
- **Enchantments considered**
- **Hastily harvest crops while quickly replanting seeds.**
- **Use the applicable tool while sneaking to activate effect.**
- **Control who has access to the effect with a custom settings menu.**
- **Designed to be compatible.**
     - This addon dose not use the player.json so it will be compatible with any addon that uses it. 
     - This addon should world on custom Trees & Axe tools. ⬇

        ```Provided creators are using the proper tagging this addon should be compatible with any other addon.```


## For Creators
The structure of the addon was designed to work with vanilla parity in mind and so compatibility requires use of standard formatting.

`This simply means Blocks & items will require tags to function correctly.`
```json
//Axe item
"components": { "tag:minecraft:is_axe": {}}
```
`The script is additionally searching for the key is_axe so you can swap minecraft out for your own identifier or simple use is_axe, this method is applicable to the following examples.`


```json
//Axe item
"components": { "tag:is_axe": {}}
```
```json
//Pickaxe item
"components": { "tag:is_pickaxe": {}}
```
```json
//Shear item
"components": { "tag:is_shear": {}}
```
```json
//Hoe item
"components": { "tag:is_hoe": {}}
```
```json
//Seed item
"components": { "tag:is_seed": {}} // this tag is optional the script additionally checks for files ending with _seed
```
```json
//Log Block
"components": { "tag:is_log": {}} // this tag is optional the script additionally checks for files ending with _log
```
```json
//Log Block
"components": { "tag:is_leaf": {}} // this tag is optional the script additionally checks for files ending with _leaves
```
```json
//Log Block
"components": { "tag:is_ore": {}} // this tag is optional the script additionally checks for files ending with _ore
```