// Configuration
const CONFIG = {
    audioFiles: ["07. 光ノ風吹ク丘 - Hills Of Radiant Winds.flac", "Catharsis.mp3"],
    defaultVolume: 0.1,
    volumeStep: 0.01
};

// État global
const starsCache = {};
const AudioState = {
    playing: false,
    currentTrack: 1,
    audio: null,
    el: {}
};

function initMusicPlayer() {
    AudioState.audio = new Audio(`src/media/audio/${CONFIG.audioFiles[AudioState.currentTrack]}`);
    AudioState.audio.volume = CONFIG.defaultVolume;

    // All my HTML elements
    AudioState.el = {
        toggle: document.getElementById("music-toggle"),
        progress: document.getElementById("progress-slider"),
        volume: document.getElementById("volume-control"),
        info: document.getElementById("track-info")
    };

    // Lecture/pause via le toggle
    AudioState.el.toggle?.addEventListener("change", () => {
        AudioState.playing = AudioState.el.toggle.checked;
        AudioState.playing ? AudioState.audio.play() : AudioState.audio.pause();
        AudioState.el.info.textContent = CONFIG.audioFiles[AudioState.currentTrack];
    });

    // Mise à jour de la barre de progression
    AudioState.audio.addEventListener("timeupdate", () => {
        AudioState.el.progress.value = (AudioState.audio.currentTime / AudioState.audio.duration) * 100;
    });

    AudioState.audio.addEventListener("ended", () => {
        AudioState.currentTrack++;
        if (AudioState.currentTrack >= CONFIG.audioFiles.length) {
            AudioState.currentTrack = 0;
        }
        
        AudioState.audio.src = `src/media/audio/${CONFIG.audioFiles[AudioState.currentTrack]}`;
        AudioState.audio.play();
        AudioState.el.info.textContent = CONFIG.audioFiles[AudioState.currentTrack];
    });

    // Déplacement (manuel) dans la piste
    AudioState.el.progress?.addEventListener("input", () => {
        AudioState.audio.currentTime = (AudioState.el.progress.value / 100) * AudioState.audio.duration;
    });

    // Réglage du volume à la molette
    AudioState.el.volume?.addEventListener("wheel", e => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? CONFIG.volumeStep : -CONFIG.volumeStep;
        AudioState.audio.volume = Math.min(1, Math.max(0, AudioState.audio.volume + delta));
    });
}

// navigation interne
const Navigation = {
    // Initialise les événements de navigation
    init() {
        document.querySelectorAll(".navigation-link").forEach(link =>
            link.addEventListener("click", async e => {
                e.preventDefault();
                const filePath = link.dataset.page;
                await PageLoader.load(filePath);
            })
        );

        // Gère la navigation arrière/avant du navigateur
        window.addEventListener("popAudioState", async e =>
            await PageLoader.load(e.AudioState?.page || "pages/home.html")
        );
    }
};

// Chargement de pages HTML
const PageLoader = {
    // Charge un fichier HTML dans la zone de contenu
    async load(filePath) {
        const main = document.getElementById("content-area");
        const path = document.getElementById("current-path");

        try { // https://sqlpey.com/javascript/top-4-methods-to-return-html-using-fetch-api/
            const html = await (await fetch(filePath)).text();
            main.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
            path.textContent = `~ / ${filePath.split("/").pop().replace(".html", "")}`;

            this.updateStarsOnPage();
        } catch {
            main.innerHTML = `<div class="error">Error loading ${filePath}</div>`;
        }
    },

    async fetchRepoData() {
        const elements = document.querySelectorAll("[data-url]");
        await Promise.all(
            Array.from(elements).map(async el => {
                const repo = el.dataset.url;
                if (!starsCache[repo]) {
                    const res = await fetch(`https://api.github.com/repos/kagamiie/${repo}`);
                    const data = await res.json();
                    starsCache[repo] = data.stargazers_count || 0;
                }
                const starsEl = el.querySelector("#stars-count");
                if (starsEl) starsEl.textContent = starsCache[repo];
            }
        ));
    },

    updateStarsOnPage() {
        document.querySelectorAll("[data-url]").forEach(el => {
            const repo = el.dataset.url;
            const starsEl = el.querySelector("#stars-count");
            if (starsEl && starsCache[repo] !== undefined) starsEl.textContent = starsCache[repo];

        });
    },
    
    // Charge la page actuelle en fonction de l’URL (hash)
    async loadCurrent() {
        const hash = location.hash.substring(1) || "home";
        const filePath = document.querySelector(`[data-page*="${hash}"]`)?.dataset.page || "src/pages/home.html";
        await this.load(filePath); // attend que load() finisse
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    initMusicPlayer();
    Navigation.init();
    document.getElementById("music-toggle").checked = false;

    // attendre que la page home/etc.. soit chargée avant fetchRepoData
    await PageLoader.loadCurrent();
    await PageLoader.fetchRepoData();
});

window.addEventListener("load", () => console.log("Page loaded"));