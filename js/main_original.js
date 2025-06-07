// js/main.js
let game; // Global game instance

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = Utils.qs('#loading-screen');
    const gameContainer = Utils.qs('#game-container');

    // Ensure game container is ready to be shown, but keep it hidden initially via JS too
    gameContainer.style.opacity = '0';
    gameContainer.style.visibility = 'hidden';

    // Define adjustIsoScale here so it's in scope for the .then()
    const isoWorld = Utils.qs('#iso-world');
    function adjustIsoScale() {
        if (!isoWorld) {
            console.warn("adjustIsoScale called, but #iso-world not found.");
            return;
        }
        const scaleFactor = Math.min(window.innerWidth / 1200, window.innerHeight / 800);
        let newScale = 0.7;
        if (window.innerWidth < 768 || window.innerHeight < 600) {
            newScale = Math.max(0.45, 0.6 * scaleFactor) ;
        } else if (window.innerWidth < 1200 || window.innerHeight < 800) {
            newScale = Math.max(0.55, 0.65 * scaleFactor);
        } else {
            newScale = Math.max(0.6, 0.7 * scaleFactor);
        }
        isoWorld.style.scale = `${Math.min(newScale, 0.9)}`; // Cap max scale
    }

    try {
        game = new GameManager();
        game.init()
            .then(() => {
                console.log("Game initialized successfully and displayed.");
                adjustIsoScale(); // Call AFTER game is initialized and container is visible
                window.addEventListener('resize', Utils.debounce(adjustIsoScale, 150)); // Add resize listener after success
            })
            .catch(error => {
                console.error("Error during game initialization promise:", error);
                loadingScreen.innerHTML = `<p style="color:red;">Error initializing game (async). Check console.</p><pre>${error.stack ? error.stack : error}</pre>`;
                // Ensure loading screen is visible if it was hidden by a partial success in game.init()
                loadingScreen.style.display = 'flex';
                loadingScreen.style.flexDirection = 'column';
                loadingScreen.style.alignItems = 'center';
                loadingScreen.style.justifyContent = 'center';
                gameContainer.style.opacity = '0';
                gameContainer.style.visibility = 'hidden';
            });

    } catch (error) {
        console.error("Critical error setting up GameManager (sync):", error);
        loadingScreen.innerHTML = `<p style="color:red;">Critical synchronous error. Check console.</p><pre>${error.stack ? error.stack : error}</pre>`;
        loadingScreen.style.display = 'flex';
        loadingScreen.style.flexDirection = 'column';
        loadingScreen.style.alignItems = 'center';
        loadingScreen.style.justifyContent = 'center';
        gameContainer.style.opacity = '0';
        gameContainer.style.visibility = 'hidden';
    }

    // Tooltip Listeners
    const tooltipElement = Utils.qs('#tooltip');
    if (tooltipElement) {
        document.body.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                tooltipElement.innerHTML = target.dataset.tooltip;
                tooltipElement.style.display = 'block';
            }
        });
        document.body.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                tooltipElement.style.display = 'none';
            }
        });
        document.body.addEventListener('mousemove', (e) => {
            if (tooltipElement.style.display === 'block') {
                let x = e.clientX + 15;
                let y = e.clientY + 15;
                const tooltipRect = tooltipElement.getBoundingClientRect();

                if (x + tooltipRect.width > window.innerWidth) {
                    x = e.clientX - tooltipRect.width - 15;
                }
                if (y + tooltipRect.height > window.innerHeight) {
                    y = e.clientY - tooltipRect.height - 15;
                }
                if (x < 0) x = 5;
                if (y < 0) y = 5;

                tooltipElement.style.left = `${x}px`;
                tooltipElement.style.top = `${y}px`;
            }
        });
    } else {
        console.warn("Tooltip element #tooltip not found.");
    }


    // Hotkey Listeners
    window.addEventListener('keydown', (e) => {
        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
             return;
        }
        // Check if game and its UI manager are initialized before accessing properties
        if (game && game.uiManager && (game.uiManager.dialogueBox.style.display === 'block' || Utils.qs('.swal2-container'))) {
            return;
        }

        let targetButton = null;
        switch(e.key.toLowerCase()) {
            case 'i': targetButton = Utils.qs('#inventory-btn'); break;
            case 'q': targetButton = Utils.qs('#quests-btn'); break;
            case 'm': targetButton = Utils.qs('#map-btn'); break;
            case 'escape': targetButton = Utils.qs('#settings-btn'); break;
        }
        if (targetButton) {
            targetButton.click();
        }
    });
});