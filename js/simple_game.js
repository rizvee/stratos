// js/simple_game.js

// --- DOM Element References ---
let energyLevelElement;
let messageBoxElement;
let messageTextElement;
let messageCloseBtnElement;
// let playerCharacterElement; // Will be used later for movement/interaction
let isoWorldElement;      // Will be used later for interactions

// --- Resource Node States ---
let resourceNodeStates = {}; // Example: { 'resource-node-1': { timerId: null } }

// --- Quest State ---
let quest = {
    description: "Collect 3 energy crystals.",
    targetItem: "crystal",
    targetCount: 3,
    isComplete: false,
    rewardGiven: false // Added to ensure reward is given only once
};

// --- Player State ---
let player = {
    energy: 100,
    inventory: []
};

// --- Game State ---
let gameLoopInterval = null;
const TICKS_PER_SECOND = 10;

// --- Initialization Function ---
function initGame() {
    // Get DOM elements
    energyLevelElement = document.getElementById('energy-level');
    messageBoxElement = document.getElementById('message-box');
    messageTextElement = document.getElementById('message-text');
    messageCloseBtnElement = document.getElementById('message-close-btn');
    // playerCharacterElement = document.getElementById('player-character');
    isoWorldElement = document.getElementById('iso-world');

    // Setup message box close button
    if (messageCloseBtnElement) {
        messageCloseBtnElement.addEventListener('click', () => {
            if (messageBoxElement) {
                messageBoxElement.style.display = 'none';
            }
        });
    }

    // Initial HUD update
    updateHUD();

    // Start the game loop
    gameLoopInterval = setInterval(update, 1000 / TICKS_PER_SECOND);
    console.log("Simple game initialized and loop started.");

    // Add event listener to isoWorld for resource node clicks
    if (isoWorldElement) {
        isoWorldElement.addEventListener('click', function(event) {
            const target = event.target;
            // Check if the clicked element is a resource node and not currently on cooldown
            if (target.classList.contains('resource-node') && !target.classList.contains('used')) {
                handleResourceNodeClick(target);
            }
            // Check if the clicked element is the NPC quest giver
            else if (target.id === 'npc-questgiver' || (target.classList.contains('npc') && target.dataset.type === 'npc')) {
                handleQuestGiverClick();
            }
            // Future: Add checks for Workbench here
        });
    }
}

// --- Quest Giver Click Handler ---
function handleQuestGiverClick() {
    if (quest.isComplete && quest.rewardGiven) {
        showMessage("You already completed the quest and received your reward! Thanks again!");
        return;
    }
    if (quest.isComplete && !quest.rewardGiven) { // Quest items submitted, but reward not yet given
        player.energy += 50; // Example reward
        quest.rewardGiven = true;
        updateHUD();
        showMessage("Excellent work! Here's 50 energy for your efforts.");
        return;
    }

    // Count how many target items the player has
    let itemCount = 0;
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i] === quest.targetItem) {
            itemCount++;
        }
    }

    if (itemCount >= quest.targetCount) {
        quest.isComplete = true;
        // Remove quest items from inventory - simple removal of all instances for now
        player.inventory = player.inventory.filter(item => item !== quest.targetItem);

        // Give reward immediately upon completion in this simplified model
        player.energy += 50; // Example reward
        quest.rewardGiven = true;
        updateHUD();

        showMessage("Quest Complete! You collected " + quest.targetCount + " " + quest.targetItem + "s. You gain 50 energy!");
        console.log("Quest completed. Inventory:", player.inventory);

    } else {
        showMessage(quest.description + " You have " + itemCount + "/" + quest.targetCount + " " + quest.targetItem + "s.");
    }
}

// --- Resource Node Click Handler ---
function handleResourceNodeClick(nodeElement) {
    const nodeId = nodeElement.id;

    // Grant resources
    player.energy += 25; // Grant 25 energy
    player.inventory.push('crystal'); // Add a crystal to inventory
    updateHUD(); // Update HUD to show new energy (and inventory if displayed later)

    // Log for now, can replace with showMessage later if desired
    console.log('Gathered from ' + nodeId + '! Energy: ' + player.energy + ', Inventory:', player.inventory);
    // showMessage('Gathered 25 energy and 1 crystal from ' + nodeId);

    // Visually mark as used and set cooldown
    nodeElement.classList.add('used');

    // Clear any existing timer for this node before setting a new one
    if (resourceNodeStates[nodeId] && resourceNodeStates[nodeId].timerId) {
        clearTimeout(resourceNodeStates[nodeId].timerId);
    }

    const newTimerId = setTimeout(() => {
        nodeElement.classList.remove('used');
        if (resourceNodeStates[nodeId]) {
            resourceNodeStates[nodeId].timerId = null;
        }
        console.log(nodeId + ' reactivated.');
    }, 5000); // 5 second cooldown

    resourceNodeStates[nodeId] = { timerId: newTimerId };
}

// --- Main Game Loop ---
function update() {
    // Decay player energy
    player.energy -= 0.1; // Example decay rate

    // Update HUD
    updateHUD();

    // Check for game over
    if (player.energy <= 0) {
        player.energy = 0; // Clamp energy at 0
        updateHUD(); // Ensure HUD shows 0 energy
        gameOver();
    }
}

// --- UI Functions ---
function updateHUD() {
    if (energyLevelElement) {
        energyLevelElement.textContent = Math.floor(player.energy);
    }
}

function showMessage(text) {
    if (messageBoxElement && messageTextElement) {
        messageTextElement.textContent = text;
        messageBoxElement.style.display = 'block'; // Or 'flex' if styled with display:flex
    } else {
        console.warn("Message box elements not found. Cannot show message:", text);
        alert(text); // Fallback if proper message box isn't there
    }
}

// --- Game Over Function ---
function gameOver() {
    clearInterval(gameLoopInterval); // Stop the game loop
    showMessage("Game Over! Your energy ran out.");
    console.log("Game Over triggered.");
    // Future: Could add more logic here, like disabling interactions.
}

// --- Event Listener for DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', initGame);
