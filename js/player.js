// js/player.js
class Player {
    constructor(name = "Citizen") {
        this.name = name;
        // Ensure GameConfig is accessible and these keys exist
        this.energy = GameConfig.INITIAL_ENERGY || 100;
        this.food = GameConfig.INITIAL_FOOD || 100;
        this.reputation = GameConfig.INITIAL_REPUTATION || 0;
        
        this.inventory = [
            { id: 'eco_lamp', name: 'Eco Lamp', quantity: 1, type: 'furniture', svg: 'https://www.svgrepo.com/show/474979/lamp.svg', w:15, d:15, h:25},
            { id: 'hydro_plant_small', name: 'Small Hydroponic Plant', quantity: 2, type: 'plant', svg: 'https://www.svgrepo.com/show/508788/plant-pot-619.svg', w:20, d:20, h:20},
            { id: 'data_terminal', name: 'Data Terminal', quantity: 1, type: 'tech', svg: 'https://www.svgrepo.com/show/309428/terminal.svg', w:25, d:15, h:20}
        ];
        
        this.podCustomizations = {
            'slot_corner_1': null,
            'slot_wall_1': null,
            'slot_center_1': null,
        };
        
        this.podSlots = {
            'slot_corner_1': { x: 5, y: 5, z: 0, tooltip: "Corner Slot" },
            'slot_wall_1': { x: 5, y: 30, z: 0, tooltip: "Wall Slot" },
            'slot_center_1': { x: 25, y: 25, z: 0, tooltip: "Center Slot" }
        };
        
        this.currentZone = GameConfig.ROOFTOP_COMMUNE || 'zone-rooftop-commune';
        this.position = { x: 80, y: 80, z: 0 };
        
        this.factionReputation = {
            [GameConfig.FACTIONS?.HARMONISTS || 'Harmonists']: 0,
            [GameConfig.FACTIONS?.STREAMLINE || 'Streamline']: 0,
            [GameConfig.FACTIONS?.NULL || 'Null']: 0,
        };
    }

    // THIS IS THE METHOD IN QUESTION
    updateStats(deltaEnergy = 0, deltaFood = 0, deltaRep = 0) {
        this.energy = Math.max(0, Math.min(100, this.energy + deltaEnergy));
        this.food = Math.max(0, Math.min(100, this.food + deltaFood));
        this.reputation += deltaRep;
        // Potentially trigger UI update or events if stats change significantly
    }

    addItem(item) {
        if (!item || !item.id || typeof item.quantity !== 'number') {
            console.error("Invalid item added:", item);
            return;
        }
        const existingItem = this.inventory.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.inventory.push({ ...item }); // Push a copy
        }
        // Assuming 'game' is globally accessible or uiManager is passed if needed here
        if (game && game.uiManager) {
            game.uiManager.showAlert('Item Acquired', `You got ${item.quantity}x ${item.name || item.id}!`, 'success');
        }
    }
    
    hasItem(itemId, quantity = 1) {
        const item = this.inventory.find(i => i.id === itemId);
        return item && item.quantity >= quantity;
    }

    removeItem(itemId, quantity = 1) {
        const itemIndex = this.inventory.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            if (this.inventory[itemIndex].quantity > quantity) {
                this.inventory[itemIndex].quantity -= quantity;
            } else if (this.inventory[itemIndex].quantity === quantity) {
                this.inventory.splice(itemIndex, 1);
            } else {
                return false; // Not enough to remove
            }
            return true;
        }
        return false; // Item not found
    }

    customizePod(slotId, itemId) {
        if (!this.podSlots[slotId]) {
            console.error("Invalid pod slot:", slotId);
            return false;
        }
        
        const itemToPlace = this.inventory.find(i => i.id === itemId);
        if (!itemToPlace) { // Check if item exists in inventory first
            if (game && game.uiManager) game.uiManager.showAlert("Cannot Customize", "Item not found in inventory.", "warning");
            return false;
        }
        if (itemToPlace.quantity === 0) { // Should not happen if filtered correctly but good check
             if (game && game.uiManager) game.uiManager.showAlert("Cannot Customize", "You don't have that item (quantity 0).", "warning");
            return false;
        }


        const oldItemId = this.podCustomizations[slotId];
        if (oldItemId && oldItemId !== itemId) { // If replacing with a different item
            // Return the old item to inventory. Find its full data.
            const oldItemData = GameConfig.ALL_ITEMS.find(i => i.id === oldItemId);
            if (oldItemData) {
                this.addItem({ ...oldItemData, quantity: 1 }); // Add a copy back
            } else {
                console.warn(`Data for old item '${oldItemId}' not found in ALL_ITEMS to return to inventory.`);
            }
        }

        this.podCustomizations[slotId] = itemId;
        // For simplicity, we don't "consume" the item from inventory when placed.
        // If you want to consume, call this.removeItem(itemId, 1); but ensure you handle returning it correctly.
        
        if (game && game.uiManager) game.uiManager.showAlert("Pod Customized", `${itemToPlace.name} placed in ${this.podSlots[slotId].tooltip || slotId.replace(/_/g, ' ')}.`, "success");
        
        // Ensure RooftopCommuneZone and its method exist before calling
        if (typeof RooftopCommuneZone !== 'undefined' && typeof RooftopCommuneZone.renderPodCustomizations === 'function') {
            RooftopCommuneZone.renderPodCustomizations(this);
        } else {
            console.warn("RooftopCommuneZone.renderPodCustomizations not available to update pod visuals.");
        }
        return true;
    }

    getPlacedItemInSlot(slotId) {
        const itemId = this.podCustomizations[slotId];
        if (!itemId) return null;
        // Prefer item data from inventory if it's still there (e.g., if not consumed on placement)
        // otherwise, fall back to global item list.
        return this.inventory.find(invItem => invItem.id === itemId) || 
               (GameConfig.ALL_ITEMS || []).find(globalItem => globalItem.id === itemId);
    }
}