// js/zones/verticalFarm.js
class VerticalFarmZone {
    constructor(gameManager) {
        this.game = gameManager;
        this.zoneId = GameConfig.VERTICAL_FARM; // Ensure GameConfig.VERTICAL_FARM is correct
        this.element = Utils.qs(`#${this.zoneId}`);
        if (!this.element) {
            console.error(`VerticalFarmZone: Element with ID '${this.zoneId}' not found.`);
            return; // Stop constructor if element is missing
        }
        this.farmPlots = [];
        this.initPlots(); // Call initPlots only if element exists
    }

    initPlots() {
        if (!this.element) return; // Should have been caught in constructor, but good safety

        const farmTower = this.element.querySelector('.farm-tower');
        if (!farmTower) {
            console.warn("VerticalFarmZone.initPlots: '.farm-tower' element not found.");
            return;
        }

        // Clear existing plots if re-initializing (though typically initPlots is called once)
        Utils.qsa('.farm-plot', farmTower).forEach(el => el.remove());
        this.farmPlots = []; // Reset array

        const levels = ['50px', '150px', '250px']; // Z-offsets for farm levels
        const plotsPerLevel = 3;
        const plotSize = { w: 35, d: 35, h: 10 }; // Base size for plots

        levels.forEach((levelZ, levelIndex) => {
            for (let i = 0; i < plotsPerLevel; i++) {
                const plot = document.createElement('div');
                plot.classList.add('iso-object', 'farm-plot'); // .iso-object for base cuboid
                const plotId = `plot_${levelIndex}_${i}`;
                plot.dataset.plotId = plotId;
                // Initial state is empty
                plot.style.setProperty('--bg-color', 'rgba(80,150,80,0.7)');
                plot.dataset.tooltip = `Farm Plot (${plotId}) - Empty`;

                plot.style.setProperty('--x', `${20 + i * (plotSize.w + 10)}px`); // Spacing
                plot.style.setProperty('--y', `${20 + levelIndex * 5}px`); // Visual stagger on Y
                plot.style.setProperty('--z', levelZ);
                plot.style.setProperty('--w', `${plotSize.w}px`);
                plot.style.setProperty('--d', `${plotSize.d}px`);
                plot.style.setProperty('--h', `${plotSize.h}px`);
                
                plot.style.border = '1px solid #3A6A3A';

                farmTower.appendChild(plot);
                this.farmPlots.push({ id: plotId, element: plot, crop: null });

                plot.addEventListener('click', () => this.onPlotClick(plotId));
            }
        });
        console.log(`VerticalFarmZone: Initialized ${this.farmPlots.length} farm plots.`);
    }
    
    onPlotClick(plotId) {
        if (!this.game || !this.game.ecoManager || !this.game.uiManager) {
            console.error("Game managers not available for onPlotClick.");
            return;
        }
        const plotData = this.farmPlots.find(p => p.id === plotId);
        if (!plotData) return;

        const currentCrop = this.game.ecoManager.cropGrowth[plotId];

        if (currentCrop) {
            if (currentCrop.progress >= 100) {
                this.game.uiManager.showDialogue(
                    "Farm Interface",
                    `Plot ${plotId} (${currentCrop.type.replace(/_/g, ' ')}) is ready to harvest!`,
                    [{ text: "Harvest", callback: () => {
                        this.game.ecoManager.harvestCrop(plotId);
                        // Visual update handled by updatePlotVisuals
                        this.updatePlotVisuals(); 
                    }}, {text: "Leave it", callback: () => {}}]
                );
            } else {
                 this.game.uiManager.showAlert("Farm Plot", `Plot ${plotId} has ${currentCrop.type.replace(/_/g, ' ')} growing. Progress: ${Math.floor(currentCrop.progress)}%`);
            }
        } else {
             this.game.uiManager.showDialogue(
                "Farm Interface",
                `Plot ${plotId} is empty. Plant something?`,
                [
                    { text: "Plant Hydroponic Lettuce", callback: () => {
                        this.game.ecoManager.plantCrop(plotId, 'hydroponic_lettuce');
                        this.updatePlotVisuals();
                    }},
                    { text: "Plant Super Grain", callback: () => {
                         this.game.ecoManager.plantCrop(plotId, 'super_grain');
                         this.updatePlotVisuals();
                    }},
                    { text: "Cancel", callback: () => {} }
                ]
            );
        }
    }

    onEnter() {
        console.log("Entered Vertical Farm (VerticalFarmZone.onEnter)");
        if (!this.element) return;

        // Animate main tower and levels
        const mainElements = this.element.querySelectorAll('.farm-tower, .farm-level');
        if (mainElements.length > 0) {
            gsap.fromTo(mainElements, 
                { opacity: 0, y: 30 }, // y for a slight slide-in effect on the 2D plane
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
            );
        } else {
            console.warn("VerticalFarmZone: No '.farm-tower, .farm-level' elements found for GSAP animation.");
        }
        this.updatePlotVisuals(); // Ensure plots are visually correct on entry
        
        // Animate farm plots after a slight delay for main elements
        const plotElements = this.farmPlots.map(p => p.element);
        if (plotElements.length > 0) {
            gsap.fromTo(plotElements,
                { opacity: 0, scale: 0.7 },
                { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03, delay: 0.3, ease: "back.out(1.5)" }
            );
        }
    }

    update(deltaTime) {
        if (!this.game || !this.game.ecoManager) return;

        let visualsNeedUpdate = false;
        for (const plotId in this.game.ecoManager.cropGrowth) {
            const crop = this.game.ecoManager.cropGrowth[plotId];
            if (crop.progress < 100) {
                const oldProgress = crop.progress;
                // Example growth rate, tied to ecoManager logic now potentially
                // Assuming ecoManager.update handles the actual progress increment.
                // Here we just check if it reached 100 for visual change.
                if (this.game.ecoManager.cropGrowth[plotId] && this.game.ecoManager.cropGrowth[plotId].progress >= 100 && oldProgress < 100) {
                    visualsNeedUpdate = true;
                }
            }
        }
        if(visualsNeedUpdate) this.updatePlotVisuals();
    }

    updatePlotVisuals() {
        if (!this.game || !this.game.ecoManager) return;

        this.farmPlots.forEach(plotData => {
            const crop = this.game.ecoManager.cropGrowth[plotData.id];
            const plotEl = plotData.element;
            plotEl.classList.remove('ready-to-harvest', 'svg-object'); // Reset classes
            plotEl.style.backgroundImage = 'none'; // Clear any SVG background

            if(crop) {
                plotEl.dataset.tooltip = `${crop.type.replace(/_/g, ' ')} (${plotData.id}) - Growing: ${Math.floor(crop.progress)}%`;
                if(crop.progress >= 100) {
                    plotEl.style.setProperty('--bg-color', '#32CD32'); // Bright green when ready
                    plotEl.classList.add('ready-to-harvest');
                    plotEl.dataset.tooltip = `${crop.type.replace(/_/g, ' ')} (${plotData.id}) - Ready to Harvest!`;
                } else if (crop.progress > 0) { // Growing, but not ready
                    plotEl.classList.add('svg-object'); // Use SVG for seedling/growing plant
                    // Choose SVG based on crop type or generic seedling
                    let plantSvg = 'https://www.svgrepo.com/show/452000/plant-seedling.svg'; // Default seedling
                    if (crop.type === 'super_grain') plantSvg = 'https://www.svgrepo.com/show/306765/wheat.svg'; // Example
                    else if (crop.type === 'hydroponic_lettuce') plantSvg = 'https://www.svgrepo.com/show/475587/lettuce.svg'; // Example
                    
                    plotEl.style.backgroundImage = `url('${plantSvg}')`;
                    plotEl.style.setProperty('--bg-color', 'transparent'); // SVG provides visuals
                } else { // progress is 0, just planted, or error
                     plotEl.style.setProperty('--bg-color', '#A8D8A8'); // Default planted color (pre-SVG)
                }
            } else { // Empty plot
                plotEl.style.setProperty('--bg-color', 'rgba(80,150,80,0.7)');
                plotEl.dataset.tooltip = `Farm Plot (${plotData.id}) - Empty`;
            }
        });
    }

    onExit() {
        console.log("Exited Vertical Farm");
    }
}