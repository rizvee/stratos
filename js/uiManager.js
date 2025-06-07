class UIManager {
    constructor() {
        this.hud = {
            playerName: Utils.qs('#player-name'),
            energy: Utils.qs('#energy-level'),
            food: Utils.qs('#food-level'),
            reputation: Utils.qs('#reputation-level'),
            time: Utils.qs('#game-time'),
        };
        this.dialogueBox = Utils.qs('#dialogue-box');
        this.dialogueSpeaker = Utils.qs('#dialogue-speaker');
        this.dialogueText = Utils.qs('#dialogue-text');
        this.dialogueOptions = Utils.qs('#dialogue-options');
        this.tooltip = Utils.qs('#tooltip');

        this.initEventListeners();
    }

    initEventListeners() {
        // Tooltips for iso-objects
        Utils.qsa('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', (e) => this.showTooltip(e.target.dataset.tooltip, e));
            el.addEventListener('mouseleave', () => this.hideTooltip());
            el.addEventListener('mousemove', (e) => this.moveTooltip(e));
        });
    }

    showTooltip(text, event) {
        this.tooltip.textContent = text;
        this.tooltip.style.display = 'block';
        this.moveTooltip(event);
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    moveTooltip(event) {
        // Position tooltip near cursor, ensuring it stays within viewport
        let x = event.clientX + 15;
        let y = event.clientY + 15;
        if (x + this.tooltip.offsetWidth > window.innerWidth) {
            x = event.clientX - this.tooltip.offsetWidth - 15;
        }
        if (y + this.tooltip.offsetHeight > window.innerHeight) {
            y = event.clientY - this.tooltip.offsetHeight - 15;
        }
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    updateHUD(playerData) {
        if (playerData.name) this.hud.playerName.textContent = playerData.name;
        this.hud.energy.textContent = Math.floor(playerData.energy);
        this.hud.food.textContent = Math.floor(playerData.food);
        this.hud.reputation.textContent = playerData.reputation;
    }

    updateTime(gameTime) { // gameTime in minutes
        const hours = String(Math.floor(gameTime / 60) % 24).padStart(2, '0');
        const minutes = String(gameTime % 60).padStart(2, '0');
        this.hud.time.textContent = `${hours}:${minutes}`;
    }

    showDialogue(speaker, text, options = []) { // options = [{text: "Choice 1", callback: () => {}}]
        this.dialogueSpeaker.textContent = speaker;
        this.dialogueText.innerHTML = text; // Use innerHTML for potential formatting
        this.dialogueOptions.innerHTML = ''; // Clear old options

        options.forEach(opt => {
            const button = document.createElement('button');
            button.textContent = opt.text;
            button.addEventListener('click', () => {
                this.hideDialogue();
                if (opt.callback) opt.callback();
            });
            this.dialogueOptions.appendChild(button);
        });
        this.dialogueBox.style.display = 'block';
        gsap.fromTo(this.dialogueBox, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 });
    }

    hideDialogue() {
        gsap.to(this.dialogueBox, { opacity: 0, y: 20, duration: 0.3, onComplete: () => {
            this.dialogueBox.style.display = 'none';
        }});
    }

    showAlert(title, text, icon = 'info') { // 'success', 'error', 'warning', 'info', 'question'
        Swal.fire({ title, text, icon });
    }
}