// Configuration
const CONFIG = {
    audioFiles: ["07. 光ノ風吹ク丘 - Hills Of Radiant Winds.flac", "Catharsis.mp3"],
    defaultVolume: 0.1,
    volumeStep: 0.01
};

// État global
const state = {
    playing: false,
    currentTrack: 1,
    audio: null,
    el: {}
};

function initMusicPlayer() {
    state.audio = new Audio(`src/media/audio/${CONFIG.audioFiles[state.currentTrack]}`);
    state.audio.volume = CONFIG.defaultVolume;

    // All my HTML elements
    state.el = {
        toggle: document.getElementById("music-toggle"),
        progress: document.getElementById("progress-slider"),
        volume: document.getElementById("volume-control"),
        info: document.getElementById("track-info")
    };

    // Lecture/pause via le toggle
    state.el.toggle?.addEventListener("change", () => {
        state.playing = state.el.toggle.checked;
        state.playing ? state.audio.play() : state.audio.pause();
        state.el.info.textContent = CONFIG.audioFiles[state.currentTrack];
    });

    // Mise à jour de la barre de progression
    state.audio.addEventListener("timeupdate", () => {
        state.el.progress.value = (state.audio.currentTime / state.audio.duration) * 100;
    });

    state.audio.addEventListener("ended", () => {
        state.currentTrack++;
        if (state.currentTrack >= CONFIG.audioFiles.length) {
            state.currentTrack = 0;
        }
        
        state.audio.src = `src/media/audio/${CONFIG.audioFiles[state.currentTrack]}`;
        state.audio.play();
        state.el.info.textContent = CONFIG.audioFiles[state.currentTrack];
    });

    // Déplacement manuel dans la piste
    state.el.progress?.addEventListener("input", () => {
        state.audio.currentTime = (state.el.progress.value / 100) * state.audio.duration;
    });

    // Réglage du volume à la molette
    state.el.volume?.addEventListener("wheel", e => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? CONFIG.volumeStep : -CONFIG.volumeStep;
        state.audio.volume = Math.min(1, Math.max(0, state.audio.volume + delta));
    });
}

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
        } catch {
            main.innerHTML = `<div class="error">Error loading ${filePath}</div>`;
        }
    },

    // Charge la page actuelle en fonction de l’URL (hash)
    loadCurrent() { // pour passer en command la page au demarage
        const hash = location.hash.substring(1) || "home";
        const filePath = document.querySelector(`[data-page*="${hash}"]`)?.dataset.page || "src/pages/home.html";
        this.load(filePath);
    }
};

// navigation interne
const Navigation = {
    // Initialise les événements de navigation
    init() {
        document.querySelectorAll(".navigation-link").forEach(link =>
            link.addEventListener("click", async e => {
                e.preventDefault();
                const filePath = link.dataset.page;
                await PageLoader.load(filePath);

                // gere la bar url
                const page = filePath.split("/").pop().replace(".html", "");
                history.pushState({ page: filePath }, "", `#${page}`);
            })
        );

        // Gère la navigation arrière/avant du navigateur
        window.addEventListener("popstate", async e =>
            await PageLoader.load(e.state?.page || "pages/home.html")
        );
    }
};

document.addEventListener("DOMContentLoaded", () => {
    initMusicPlayer();
    Navigation.init();
    PageLoader.loadCurrent();
    document.getElementById("music-toggle").checked = false;
});

window.addEventListener("load", () => console.log("Page loaded"));