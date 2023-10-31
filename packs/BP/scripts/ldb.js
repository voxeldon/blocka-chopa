import * as mc from '@minecraft/server';

/**
 * Database.
*/ 
export class LDB {
    constructor() {
        this.LDB = mc.world.scoreboard;
    }

    /**
     * Hides a database at the Sidebar display slot.
     *
     * @returns {ScoreboardObjective} - The cleared ScoreboardObjective.
     */
    hideDB() {
        try {
            return this.LDB.clearObjectiveAtDisplaySlot("Sidebar");
        } catch (error) {
            console.error(`Error clearing objective at Sidebar display slot:`, error);
            return null;
        }
    }

    /**
     * Shows a specified database at the Sidebar display slot.
     *
     * @param {string} dbID - The ID of the objective to be displayed.
     * @returns {ScoreboardObjective} - The previous ScoreboardObjective set at the display slot, or undefined if no objective was previously set.
     */
    showDB(dbID) {
        const objectiveToDisplay = this.LDB.getObjective(dbID);
        if (!objectiveToDisplay) {
            console.error(`Objective with ID ${dbID} not found.`);
            return null;
        }

        try {
            return this.LDB.setObjectiveAtDisplaySlot("Sidebar", { objective: objectiveToDisplay });
        } catch (error) {
            console.error(`Error setting objective at Sidebar display slot with display settings:`, error);
            return null;
        }
    }

    /**
     * Generates a new random UUID.
     *
     * @returns {number} - A new random UUID.
     */
    newUUID() {
        const min = -2147483647;
        const max = 2147483647;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Creates a new database with the given ID.
     *
     * @param {string} dbID - The ID of the new objective.
     */
    newDB(dbID) {
        const db = this.LDB.getObjective(dbID);
        if (db) return; 
        this.LDB.addObjective(dbID, dbID);
    }

    /**
     * Removes a database with the given ID.
     *
     * @param {string} dbID - The ID of the objective to be removed.
     */
    removeDB(dbID) {
        const db = this.LDB.getObjective(dbID);
        if (!db) return;
        this.LDB.removeObjective(dbID);
    }

    /** 
     * Adds a score to a key within a specified objective.
     *
     * @param {string} dbID - The ID of the database.
     * @param {string} key - The key to which the value will be added.
     * @param {number} number - The value to be added.
     */
    addToKey(dbID, key, number) {
        let db = this.LDB.getObjective(dbID); 
        if (!db) { this.newDB(dbID); db = this.LDB.getObjective(dbID); }
        db.addScore(key, number);
    }    

    /**
     * Sets a score for a key within a specified objective.
     *
     * @param {string} dbID - The ID of the database.
     * @param {string} key - The key for which the value will be set.
     * @param {number} number - The value to be set.
     */
    setKey(dbID, key, number) {
        let db = this.LDB.getObjective(dbID); 
        if (!db) { this.newDB(dbID); db = this.LDB.getObjective(dbID); }
        db.setScore(key, number);
    } 

    /**
     * Removes a key from a specified database.
     *
     * @param {string} dbID - The ID of the objective.
     * @param {string} key - The key to be removed.
     */
    removeKey(dbID, key) {
        const db = this.LDB.getObjective(dbID);
        if (!db) return; 
        db.removeParticipant(key);
    }

    /**
     * Retrieves the specified database by ID.
     *
     * @param {string} dbID - The ID of the database to retrieve.
     * @returns {database|null} - The retrieved database or null if not found.
     */
    getDB(dbID) {
        const db = this.LDB.getObjective(dbID);
        return db || null;
    }

    /**
     * Retrieves the value of a key from a specified database.
     *
     * @param {string} dbID - The ID of the database.
     * @param {string} key - The key for which to retrieve the value.
     * @returns {number|null} - The retrieved value or null if not found.
     */
    getKeyValue(dbID, key) {
        const db = this.getDB(dbID);
        if (!db) return null;
        const score = db.getScore(key);
        return score || null;
    }

    /**
     * Retrieves a specified key object from a specified database.
     *
     * @param {string} dbID - The ID of the database.
     * @param {string} key - The key for which to retrieve the value.
     * @returns {object|null} - The retrieved object or null if not found.
     */
    getKey(dbID, key){
        const allKeys = DB.getAllKeys(dbID);
        const fetchedKey = allKeys.find(entry => entry.key === key);
        return fetchedKey;
    }
    
    /**
     * Retrieves all key-value pairs within a specified database.
     *
     * @param {string} dbID - The ID of the database.
     * @returns {Array<{key: string, value: number}>} - An array of key-value pairs.
     */
    getAllKeys(dbID) {
        const participants = this.LDB.getParticipants();
        const result = [];
    
        const db = this.getDB(dbID);
        if (!db) return result;
    
        for (const participant of participants) {
            const score = db.getScore(participant);
            if (score !== undefined) {
                result.push({
                    key: participant.displayName,
                    value: score
                });
            }
        }
    
        return result;
    }

    /**
     * Sets an array as a key-value pair within a specified database.
     *
     * @param {string} dbID - The ID of the database.
     * @param {string} key - The key for the array.
     * @param {Array} array - The array to be stored.
     */
    setArray(dbID, key, array) {
        const arrayString = JSON.stringify(array);
        let uuid;   
        try {
            const existingUUID = this.getKeyValue(dbID, key);
            uuid = existingUUID;
        } catch { uuid = this.newUUID(); }
        this.removeKey(dbID, key);
        const allKeysWithSameUUID = this.getAllKeys(dbID).filter(entry => entry.value === uuid);
        for (const entry of allKeysWithSameUUID) {
            this.removeKey(dbID, entry.key);
        }
        this.setKey(dbID, key, uuid);         
        this.setKey(dbID, arrayString, uuid); 
    }

    /**
    * Retrieves an array value associated with a specified key within a specified database.
    *
    * @param {string} dbID - The ID of the database.
    * @param {string} key - The key for the array.
    * @returns {Array|null} - The retrieved array or null if not found.
    */
    getArray(dbID, key) {
        const uuid = this.getKeyValue(dbID, key);
        if (uuid === null) {
            return null;
        }
        const allKeys = this.getAllKeys(dbID);
        for (const entry of allKeys) {
            if (entry.value === uuid && entry.key !== key) {
                return JSON.parse(entry.key);
            }
        }
        return null;
    }

    /**
    * Removes an array value and its associated key within a specified database.
    *
    * @param {string} dbID - The ID of the database.
    * @param {string} key - The key associated with the array to be removed.
    */
    removeArray(dbID, key) {
        const uuid = this.getKeyValue(dbID, key);
        if (uuid === null) {
            return;
        }
        const allKeysWithSameUUID = this.getAllKeys(dbID).filter(entry => entry.value === uuid);
        for (const entry of allKeysWithSameUUID) {
            this.removeKey(dbID, entry.key);
        }
    }
}