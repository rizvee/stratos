// js/zones/rooftopCommune.js
class RooftopCommuneZone {
    constructor(gameManager) {
        this.game = gameManager;
        this.zoneId = GameConfig.ROOFTOP_COMMUNE; // Ensure GameConfig.ROOFTOP_COMMUNE is correct
        this.element = Utils.qs(`#${this.zoneId}`);
        if (!this.element) {
            console.error(`RooftopCommuneZone: Element with ID '${this.zoneId}' not found.`);
        }
    }

    onEnter() {
        console.log("Entered Rooftop Commune (RooftopCommuneZone.onEnter)");
        if (!this.element) {
            console.error("Cannot run onEnter for RooftopCommuneZone: zone element not found.");
            return;
        }

        // Animate main zone elements if they exist
        const mainElements = this.element.querySelectorAll('.iso-building, .rooftop-planter, .iso-character.npc');
        if (mainElements.length > 0) {
            gsap.fromTo(mainElements,
                { opacity: 0, scale: 0.8, y: 10 }, // Added slight y offset for effect
                { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "back.out(1.7)" }
            );
        } else {
            console.warn("RooftopCommuneZone: No '.iso-building, .rooftop-planter, .iso-character.npc' elements found for GSAP animation within", this.element);
        }

        // Ensure pod customizations are rendered before trying to animate them
        // The player argument is needed for renderPodCustomizations
        if (this.game && this.game.player) {
            RooftopCommuneZone.renderPodCustomizations(this.game.player);
        } else {
            console.warn("RooftopCommuneZone: game.player not available for renderPodCustomizations.");
        }
    }

    update(deltaTime) {
        // Logic specific to the rooftop commune, if any
    }

    onExit() {
        console.log("Exited Rooftop Commune");
        // Optional: Add animations for exiting, e.g., fade out elements
        if (this.element) {
            // Example: Fade out elements before zone becomes inactive
            // gsap.to(this.element.querySelectorAll('.iso-building, .rooftop-planter, .iso-character.npc, .pod-item'), 
            //     { opacity: 0, duration: 0.3 });
        }
    }

    // Static method to be called when customization changes or zone is entered
    static renderPodCustomizations(playerInstance) {
        const podArea = Utils.qs('#player-pod-area'); // Assuming this ID is unique and correct
        if (!podArea) {
            console.error("RooftopCommuneZone.renderPodCustomizations: Player pod area ('#player-pod-area') not found!");
            return;
        }

        // Clear existing customization items
        Utils.qsa('.pod-item', podArea).forEach(el => el.remove());

        let itemsToAnimate = [];

        for (const slotId in playerInstance.podCustomizations) {
            const itemId = playerInstance.podCustomizations[slotId];
            if (itemId) {
                // Ensure GameConfig.ALL_ITEMS exists and is an array
                const allItems = GameConfig.ALL_ITEMS || [];
                const itemData = playerInstance.inventory.find(i => i.id === itemId) || allItems.find(i => i.id === itemId);
                const slotPosition = playerInstance.podSlots[slotId];

                if (itemData && slotPosition) {
                    const itemEl = document.createElement('div');
                    // Base classes
                    itemEl.classList.add('iso-object', 'pod-item');
                    if (itemData.svg) { // Check if it's an SVG item
                        itemEl.classList.add('svg-object');
                        itemEl.style.backgroundImage = `url('${itemData.svg}')`;
                    } else {
                        itemEl.style.setProperty('--bg-color', itemData.color || '#999999');
                        itemEl.style.setProperty('--h', `${itemData.h || 20}px`); // Use regular height for cuboid
                    }
                    
                    itemEl.dataset.tooltip = itemData.name || "Pod Item";
                    itemEl.style.setProperty('--x', `${slotPosition.x}px`);
                    itemEl.style.setProperty('--y', `${slotPosition.y}px`);
                    itemEl.style.setProperty('--z', `${slotPosition.z}px`);
                    itemEl.style.setProperty('--w', `${itemData.w || 20}px`);
                    itemEl.style.setProperty('--d', `${itemData.d || 20}px`); // For cuboid depth
                    
                    // SVG specific height if different from iso-character default
                    // This also determines the 'standing up' height for SVG-like items
                    const svgHeight = itemData.h_svg || itemData.h || 20; 
                    itemEl.style.setProperty('--h-svg', `${svgHeight}px`);

                    // Apply "stand up" transform for pod items (similar to iso-character)
                    itemEl.style.transform = `
                        translate3d(${slotPosition.x}px, ${slotPosition.y}px, calc(${slotPosition.z}px + (${svgHeight} / 2)))
                        rotateX(calc(-1 * var(--iso-angle-x)))
                        rotateZ(calc(-1 * var(--iso-angle-z)))
                    `;
                    
                    podArea.appendChild(itemEl);
                    itemsToAnimate.push(itemEl);
                }
            }
        }

        // Animate newly added pod items if any
        if (itemsToAnimate.length > 0) {
            gsap.fromTo(itemsToAnimate,
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1, duration: 0.4, stagger: 0.05, ease: "back.out(1.4)" }
            );
        } else {
            // console.log("RooftopCommuneZone.renderPodCustomizations: No pod items to animate.");
        }
    }
}