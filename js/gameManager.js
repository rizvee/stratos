// js/gameManager.js
class GameManager {
    constructor() {
        this.player = new Player("Nova");
        this.uiManager = new UIManager();
        this.ecoManager = new EcoManager(this.player);
        this.narrativeManager = new NarrativeManager(this, this.player, this.uiManager);
        this.gameTime = 0;
        this.gameLoopInterval = null;
        this.activeZoneId = GameConfig.ROOFTOP_COMMUNE; // Ensure this exists in GameConfig
        this.zones = {};
        this.isPaused = false;
        this.playerCharacterElement = null;

        this.loadingScreenElement = Utils.qs('#loading-screen');
        this.gameContainerElement = Utils.qs('#game-container');
    }

    async init() {
        console.log("Stratos initializing (GameManager.init)...");

        try {
            this.playerCharacterElement = Utils.qs('#player-character');
            if (!this.playerCharacterElement) throw new Error("Player character element (#player-character) not found in HTML.");
            
            this.updatePlayerCharacterPosition();
            this.uiManager.updateHUD(this.player); // Assumes UIManager constructor succeeded
            this.loadZones(); // Assumes Zone constructors succeed

            // Ensure initial activeZoneId is valid before calling changeZone
            if (!GameConfig[this.activeZoneId.toUpperCase().replace(/-/g, '_')] && !Utils.qs(`#${this.activeZoneId}`)) {
                 // Fallback if GameConfig constant for zone ID is missing or element is missing
                const firstAvailableZoneId = Object.keys(GameConfig.ZONE_DATA || {})[0] || GameConfig.ROOFTOP_COMMUNE;
                console.warn(`Initial activeZoneId '${this.activeZoneId}' seems invalid or its element is missing. Falling back to '${firstAvailableZoneId}'.`);
                this.activeZoneId = firstAvailableZoneId;
            }
            if (!Utils.qs(`#${this.activeZoneId}`)) {
                throw new Error(`Initial zone element '#${this.activeZoneId}' not found in HTML after fallback check.`);
            }
            this.changeZone(this.activeZoneId);

            this.setupTestInteractions(); // Add event listeners

            // UI Toggling: Hide loading, show game container
            if (this.loadingScreenElement) {
                this.loadingScreenElement.style.display = 'none';
            } else {
                console.warn("#loading-screen element not found for hiding.");
            }

            if (this.gameContainerElement) {
                this.gameContainerElement.style.visibility = 'visible';
                gsap.to(this.gameContainerElement, { opacity: 1, duration: 0.5 }); // onComplete removed
            } else {
                throw new Error("#game-container element not found for showing.");
            }

            this.startGameLoop();

            setTimeout(() => {
                if (this.narrativeManager && typeof this.narrativeManager.startDialogue === 'function') {
                    this.narrativeManager.startDialogue('system_ai_greet');
                } else {
                    console.warn("NarrativeManager or startDialogue not available for initial dialogue.");
                }
            }, 700); // Slightly increased delay

            console.log("Stratos GameManager.init phase complete.");
            return Promise.resolve();

        } catch (error) {
            console.error("Error during GameManager.init steps:", error);
            if (this.loadingScreenElement) {
                this.loadingScreenElement.innerHTML = `<p style="color:red;">Initialization Error: ${error.message}.<br>Check console for details.</p><pre>${error.stack ? error.stack : error.toString()}</pre>`;
                this.loadingScreenElement.style.display = 'flex';
                this.loadingScreenElement.style.flexDirection = 'column';
                this.loadingScreenElement.style.alignItems = 'center';
                this.loadingScreenElement.style.justifyContent = 'center';
            }
            if (this.gameContainerElement) {
                this.gameContainerElement.style.opacity = '0';
                this.gameContainerElement.style.visibility = 'hidden';
            }
            return Promise.reject(error); // Propagate the error
        }
    }

    loadZones() {
        try {
            // Ensure GameConfig zone IDs are used correctly
            if (GameConfig.ROOFTOP_COMMUNE) this.zones[GameConfig.ROOFTOP_COMMUNE] = new RooftopCommuneZone(this);
            if (GameConfig.VERTICAL_FARM) this.zones[GameConfig.VERTICAL_FARM] = new VerticalFarmZone(this);
            // Add other zone initializations here using GameConfig constants
            // e.g., if (GameConfig.CYBER_ALLEY) this.zones[GameConfig.CYBER_ALLEY] = new CyberAlleyZone(this);
            console.log("Zone logic objects instantiated for:", Object.keys(this.zones).join(', '));
        } catch(e) {
            console.error("Error instantiating zone logic objects:", e);
            // This might be critical depending on how zones are used.
        }
    }

    startGameLoop() {
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => {
            if (this.isPaused) return;
            this.update();
        }, 1000 / (GameConfig.TICKS_PER_SECOND || 10)); // Fallback for TICKS_PER_SECOND
    }

    stopGameLoop() {
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
    }

    update() {
        const deltaTime = 1 / (GameConfig.TICKS_PER_SECOND || 10);
        this.gameTime += deltaTime * 60; // Assuming 1 tick = 1 "game second" for time display

        this.player.updateStats(-0.01 * deltaTime * 10, -0.02 * deltaTime * 10); // Adjust decay rate based on ticks
        
        if (this.ecoManager) this.ecoManager.update(deltaTime);
        if (this.uiManager) {
            this.uiManager.updateHUD(this.player);
            this.uiManager.updateTime(Math.floor(this.gameTime / 60)); // gameTime is now in "game seconds"
        }
        this.updatePlayerCharacterPosition();

        if (this.activeZoneId && this.zones[this.activeZoneId] && typeof this.zones[this.activeZoneId].update === 'function') {
            this.zones[this.activeZoneId].update(deltaTime);
        }

        if (this.player.energy <= 0 || this.player.food <= 0) {
            this.gameOver();
        }
    }

    changeZone(zoneId) {
        if (!zoneId) {
            console.error("changeZone called with undefined zoneId.");
            return;
        }
        const targetZoneElement = Utils.qs(`#${zoneId}`);
        if (!targetZoneElement) {
            console.error(`Zone element '#${zoneId}' not found in HTML. Cannot switch.`);
            if (this.uiManager) this.uiManager.showAlert("Zone Error", `Cannot load zone: ${this.getZoneName(zoneId)}. Element missing.`, "error");
            return;
        }
        
        const oldZoneEl = Utils.qs(`#${this.activeZoneId}.active-zone`);
        if (oldZoneEl && oldZoneEl !== targetZoneElement) {
            oldZoneEl.classList.remove('active-zone');
            if (this.activeZoneId && this.zones[this.activeZoneId] && typeof this.zones[this.activeZoneId].onExit === 'function') {
                try { this.zones[this.activeZoneId].onExit(); }
                catch (e) { console.error(`Error in ${this.activeZoneId}.onExit():`, e); }
            }
        }
        
        this.activeZoneId = zoneId;
        this.player.currentZone = zoneId;
        
        targetZoneElement.classList.add('active-zone');

        if (this.activeZoneId && this.zones[this.activeZoneId] && typeof this.zones[this.activeZoneId].onEnter === 'function') {
            try { this.zones[this.activeZoneId].onEnter(); }
            catch (e) { console.error(`Error in ${this.activeZoneId}.onEnter():`, e); }
        } else if (!this.zones[this.activeZoneId]) {
            // console.warn(`No zone logic object found for ${this.activeZoneId}. Visuals will be static.`);
        }

        const zoneData = GameConfig.ZONE_DATA?.[zoneId];
        if (zoneData && zoneData.entryPoint) {
            this.player.position.x = zoneData.entryPoint.x;
            this.player.position.y = zoneData.entryPoint.y;
            this.player.position.z = zoneData.entryPoint.z || 0;
            this.updatePlayerCharacterPosition();
        }
        console.log(`Player entered zone: ${this.getZoneName(zoneId)}`);
    }
    
    getZoneName(zoneId) {
        if (!zoneId) return "Unknown Zone";
        // Robustly find a display name, either from GameConfig.ZONE_DATA or by parsing ID
        const zoneData = GameConfig.ZONE_DATA?.[zoneId];
        if (zoneData && zoneData.displayName) return zoneData.displayName;
        return zoneId.replace('zone-', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    updatePlayerCharacterPosition() {
        if (this.playerCharacterElement) {
            this.playerCharacterElement.style.setProperty('--x', `${this.player.position.x}px`);
            this.playerCharacterElement.style.setProperty('--y', `${this.player.position.y}px`);
            this.playerCharacterElement.style.setProperty('--z', `${this.player.position.z}px`);
        }
    }

    gameOver() {
        this.stopGameLoop();
        if (this.uiManager) this.uiManager.showAlert('Game Over', 'Your journey in Stratos has ended.', 'error');
    }

    setupTestInteractions() {
        const playerPod = Utils.qs('#zone-rooftop-commune .player-pod');
        if (playerPod) {
            playerPod.addEventListener('click', () => {
                // ... (pod interaction logic as before)
                const podSlotOptions = {};
                Object.keys(this.player.podSlots).forEach(slotId => {
                    const currentItem = this.player.getPlacedItemInSlot(slotId);
                    podSlotOptions[slotId] = `${slotId.replace(/_/g, ' ')} (Currently: ${currentItem ? currentItem.name : 'Empty'})`;
                });

                const availableItems = this.player.inventory
                    .filter(item => ['furniture', 'plant', 'tech'].includes(item.type) && item.quantity > 0);

                Swal.fire({
                    title: 'Pod Interface',
                    html: `What would you like to do? <br>
                           <button id="swal-customize-btn" class="swal2-confirm swal2-styled" style="margin-top:10px;">Customize Pod</button>
                           <button id="swal-rest-btn" class="swal2-confirm swal2-styled" style="margin-top:10px;">Rest (Energy +20)</button>`,
                    showConfirmButton: false,
                    customClass: { popup: 'game-swal-popup' },
                    didOpen: () => {
                        Utils.qs('#swal-customize-btn').addEventListener('click', async () => {
                            Swal.close();
                            const { value: slot } = await Swal.fire({
                                title: 'Select Slot to Customize',
                                input: 'select', inputOptions: podSlotOptions, inputPlaceholder: 'Select a slot',
                                showCancelButton: true, customClass: { popup: 'game-swal-popup' },
                            });
                            if (slot) {
                                const itemOptions = availableItems.reduce((obj, item) => {
                                    obj[item.id] = `${item.name} (x${item.quantity})`; return obj;
                                }, {});
                                if (Object.keys(itemOptions).length === 0) {
                                    if(this.uiManager) this.uiManager.showAlert("No Items", "You have no placeable items.", "info"); return;
                                }
                                const { value: itemId } = await Swal.fire({
                                    title: 'Select Item to Place',
                                    input: 'select', inputOptions: itemOptions, inputPlaceholder: 'Select an item',
                                    showCancelButton: true, customClass: { popup: 'game-swal-popup' },
                                });
                                if (itemId) this.player.customizePod(slot, itemId);
                            }
                        });
                        Utils.qs('#swal-rest-btn').addEventListener('click', () => {
                             this.player.updateStats(20, 0);
                             if(this.uiManager) this.uiManager.showAlert("Rest", "Energy restored by 20 units.", "success");
                             Swal.close();
                        });
                    }
                });
            });
        } else {
            console.warn("Player pod element not found for click listener in Rooftop Commune.");
        }

        const harmonistElder = Utils.qs('#harmonist-elder-npc');
        if (harmonistElder) {
            harmonistElder.addEventListener('click', () => {
                if (this.narrativeManager) this.narrativeManager.startDialogue('harmonist_elder_greet');
            });
        } else {
            console.warn("Harmonist elder NPC element not found.");
        }
        
        const mapButton = Utils.qs('#map-btn');
        if (mapButton) {
            mapButton.addEventListener('click', () => {
                const zonesForMap = Object.keys(GameConfig.ZONE_DATA || {}).map(zoneId => ({
                    id: zoneId,
                    name: this.getZoneName(zoneId)
                }));
                if (zonesForMap.length === 0) {
                    if(this.uiManager) this.uiManager.showAlert("Map Error", "No zone data available for map.", "warning");
                    return;
                }

                Swal.fire({
                    title: 'Select Zone to Travel',
                    input: 'select',
                    inputOptions: zonesForMap.reduce((obj, item) => { obj[item.id] = item.name; return obj; }, {}),
                    inputPlaceholder: 'Select a zone',
                    showCancelButton: true, customClass: { popup: 'game-swal-popup' },
                }).then((result) => {
                    if (result.isConfirmed && result.value) this.changeZone(result.value);
                });
            });
        } else {
            console.warn("Map button #map-btn not found.");
        }

        // Keyboard movement listener - moved from GameManager.setupTestInteractions to main.js for global listening.
        // It was already in main.js in a previous iteration, but if it needs to be here,
        // it should be added once, perhaps in init, and removed on game end/pause.
        // For now, let's assume it's handled in main.js to avoid duplicate listeners.
    }
}