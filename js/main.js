// js/main.js
let game; // Global game instance

document.addEventListener('DOMContentLoaded', () => {
    let loadingScreen = null;
    let gameContainer = null;
    let isoWorld = null;

    try {
        // Outer try-catch for early DOM element selection and Utils availability
        try {
            loadingScreen = Utils.qs('#loading-screen');
            // Critical check for loadingScreen
            if (!loadingScreen) {
                console.error("Critical: #loading-screen element not found!");
                alert("Critical error: UI element #loading-screen missing. Game cannot start.");
                // Attempt to make the body visible if nothing else works, so user isn't stuck on a blank page.
                document.body.style.visibility = 'visible';
                document.body.style.opacity = '1';
                document.body.innerHTML = '<p style="color:red; font-family: sans-serif; padding: 20px; text-align: center;">Critical error: #loading-screen missing. Cannot initialize game.</p>';
                return; // Stop further execution within DOMContentLoaded
            }

            gameContainer = Utils.qs('#game-container');
            // Critical check for gameContainer
            if (!gameContainer) {
                console.error("Critical: #game-container element not found!");
                // loadingScreen is guaranteed to exist here due to the check above.
                loadingScreen.innerHTML = "<p style='color:red; font-family: sans-serif; padding: 20px; text-align: center;'>Critical Error: #game-container element not found. Game cannot display.</p>";
                // Ensure loading screen is styled to be visible for this critical error
                loadingScreen.style.display = 'flex';
                loadingScreen.style.flexDirection = 'column';
                loadingScreen.style.alignItems = 'center';
                loadingScreen.style.justifyContent = 'center';
                loadingScreen.style.backgroundColor = '#1e1e1e';
                loadingScreen.style.color = 'white';
                loadingScreen.style.height = '100vh';
                loadingScreen.style.width = '100vw';
                loadingScreen.style.position = 'fixed';
                loadingScreen.style.top = '0';
                loadingScreen.style.left = '0';
                loadingScreen.style.zIndex = '999999';
                loadingScreen.style.boxSizing = 'border-box';
                return; // Stop further execution within DOMContentLoaded
            }

            isoWorld = Utils.qs('#iso-world'); // Selected early, not deemed critical enough to halt with alert.
        } catch (e) {
            // This catch block specifically handles errors if Utils or Utils.qs is undefined.
            console.error("Error during initial DOM selection (Utils might be undefined):", e);
            // Fallback to alert if loadingScreen cannot be accessed or manipulated.
            alert("A critical error occurred locating essential page elements. 'Utils' may not be available. Check console.\n" + (e.stack ? e.stack : e));
            // Try to make loadingScreen visible with a message if it was found before the error, or if querySelector works.
            // This is a best effort.
            const potentialLoadingScreen = document.querySelector('#loading-screen');
            if (potentialLoadingScreen) {
                potentialLoadingScreen.innerHTML = '<p style="color:red; font-family: sans-serif; padding: 20px; text-align: center;">Critical error: Essential utility (Utils) not found. Cannot start game.</p>';
                potentialLoadingScreen.style.display = 'flex';
                potentialLoadingScreen.style.justifyContent = 'center';
                potentialLoadingScreen.style.alignItems = 'center';
                potentialLoadingScreen.style.height = '100vh';
                potentialLoadingScreen.style.backgroundColor = '#1e1e1e';
            }
            return; // Stop further execution
        }

        // The explicit checks for loadingScreen and gameContainer are now done above.
        // If we reach here, both are guaranteed to exist.
        // The previous generic checks:
        // if (!loadingScreen) { ... }
        // if (!gameContainer) { throw new Error(...) }
        // are now redundant because of the more specific critical checks added above which halt execution.

        // isoWorld is not strictly critical for startup; adjustIsoScale checks for it.
        // It's okay if isoWorld is null here, the game can still attempt to load.
        if (!isoWorld) {
            console.warn("#iso-world element not found. Isometric scaling features will be unavailable.");
        }

        // Ensure game container is ready, but hidden. gameContainer is guaranteed non-null here.
        gameContainer.style.opacity = '0';
        gameContainer.style.visibility = 'hidden';

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
            isoWorld.style.scale = `${Math.min(newScale, 0.9)}`;
        }

        // Nested try-catch for GameManager initialization
        try {
            game = new GameManager();
            game.init()
                .then(() => {
                    console.log("Game initialized successfully and displayed.");
                    adjustIsoScale();
                    window.addEventListener('resize', Utils.debounce(adjustIsoScale, 150));
                })
                .catch(error => {
                    console.error("Error during game.init() promise:", error);
                    const errorMsg = `<p style="color:red;">Error initializing game (async). Check console.</p><pre>${error.stack ? error.stack : error}</pre>`;
                    if (loadingScreen) {
                        loadingScreen.innerHTML = errorMsg;
                        loadingScreen.style.display = 'flex';
                        loadingScreen.style.flexDirection = 'column';
                        loadingScreen.style.alignItems = 'center';
                        loadingScreen.style.justifyContent = 'center';
                    } else {
                        alert("Error initializing game (async). Loading screen unavailable. Check console.\n" + (error.stack ? error.stack : error));
                    }
                    if (gameContainer) {
                        gameContainer.style.opacity = '0';
                        gameContainer.style.visibility = 'hidden';
                    }
                });
        } catch (error) { // Sync error in GameManager constructor or init call
            console.error("Critical error setting up GameManager (sync):", error);
            const errorMsg = `<p style="color:red;">Critical synchronous error setting up game. Check console.</p><pre>${error.stack ? error.stack : error}</pre>`;
            if (loadingScreen) {
                loadingScreen.innerHTML = errorMsg;
                loadingScreen.style.display = 'flex';
                loadingScreen.style.flexDirection = 'column';
                loadingScreen.style.alignItems = 'center';
                loadingScreen.style.justifyContent = 'center';
            } else {
                alert("Critical synchronous error. Loading screen unavailable. Check console.\n" + (error.stack ? error.stack : error));
            }
            if (gameContainer) {
                gameContainer.style.opacity = '0';
                gameContainer.style.visibility = 'hidden';
            }
        }
    } catch (outerError) { // Catches errors from initial DOM selection (e.g., gameContainer null) or Utils issues
        console.error("Critical pre-initialization error:", outerError);
        const criticalMsgContent = `A critical error occurred before the game could start: ${outerError.message}. This could be due to missing HTML elements or a script loading issue. Check console for details.`;
        const fullErrorStack = outerError.stack ? outerError.stack : String(outerError);

        if (loadingScreen) { // If loadingScreen was found before this error
            try {
                loadingScreen.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif;">
                    <h2 style="color:red;">Critical Error</h2>
                    <p>${criticalMsgContent}</p>
                    <pre style="font-family: monospace; color: lightgray; background-color: #333; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; text-align: left;">${fullErrorStack}</pre>
                    <p>Please ensure all HTML elements (like #loading-screen, #game-container) are correctly defined in your HTML file and all necessary scripts (like Utils.js) are loaded before main.js.</p>
                </div>`;
                loadingScreen.style.display = 'flex';
                loadingScreen.style.flexDirection = 'column';
                loadingScreen.style.alignItems = 'center';
                loadingScreen.style.justifyContent = 'center';
                loadingScreen.style.backgroundColor = '#1e1e1e';
                loadingScreen.style.color = 'white';
                loadingScreen.style.height = '100vh';
                loadingScreen.style.width = '100vw';
                loadingScreen.style.position = 'fixed';
                loadingScreen.style.top = '0';
                loadingScreen.style.left = '0';
                loadingScreen.style.zIndex = '999999';
                loadingScreen.style.boxSizing = 'border-box';
            } catch (displayErr) {
                console.error("Error trying to display critical error on loadingScreen:", displayErr);
                alert(criticalMsgContent + "\n(Also failed to display this on the loading screen.)\nStack: " + fullErrorStack);
            }
        } else { // Fallback if loadingScreen itself was not found or error occurred before it was assigned
            alert(criticalMsgContent + "\n(Loading screen #loading-screen also not found or error occurred early.)\nStack: " + fullErrorStack);
        }

        if (gameContainer && gameContainer.style) { // Best effort to hide game container
            try {
                gameContainer.style.opacity = '0';
                gameContainer.style.visibility = 'hidden';
            } catch (e) {
                console.warn("Could not hide #game-container during critical pre-init error handling:", e);
            }
        }
    }

    // Tooltip Listeners (remains unchanged from original)
    // It's outside the main try-catch as it's not critical for game start.
    // If Utils is unavailable, this will throw an error, which is acceptable at this stage.
    try {
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
    } catch (e) {
        console.warn("Error setting up tooltip listeners, Utils might be unavailable:", e);
    }

    // Hotkey Listeners (remains unchanged from original)
    // Also outside main try-catch. If Utils is unavailable, this will throw.
    try {
        window.addEventListener('keydown', (e) => {
            if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                 return;
            }
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
    } catch (e) {
        console.warn("Error setting up hotkey listeners, Utils might be unavailable:", e);
    }
});
