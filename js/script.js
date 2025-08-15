console.log('🎵 Initializing Music Player...');

let currentSong = new Audio();
let songs = [];
let currentFolder = "";

/** ---------- Utility Functions ---------- **/

/**
 * Convert seconds to MM:SS format
 */
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${minutes}:${secs}`;
}

/**
 * Fetch HTML content and parse it into DOM elements
 */
async function fetchHTML(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;
        return div;
    } catch (error) {
        console.error(`❌ Failed to fetch ${url}:`, error);
        return null;
    }
}

/**
 * Fetch JSON with error handling
 */
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(`❌ Failed to fetch JSON from ${url}:`, error);
        return {};
    }
}

/** ---------- Song Loading & UI Updates ---------- **/

async function loadSongs(folder) {
    currentFolder = folder;
    const div = await fetchHTML(`/${folder}/`);
    if (!div) return;

    const links = Array.from(div.getElementsByTagName("a"));
    songs = links
        .filter(link => link.href.endsWith(".mp3"))
        .map(link => decodeURIComponent(link.href.split(`/${folder}/`)[1]));

    renderSongList(songs);
}

function renderSongList(songArray) {
    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    songArray.forEach(song => {
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>Artist</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div>
            </li>
        `;
    });

    // Bind click events
    document.querySelectorAll(".songList li").forEach(item => {
        item.addEventListener("click", () => {
            const track = item.querySelector(".info div").textContent.trim();
            playTrack(track);
        });
    });
}

function playTrack(track, pause = false) {
    currentSong.src = `/${currentFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }
    document.querySelector(".songinfo").textContent = track;
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
}

/** ---------- Albums Display ---------- **/

async function displayAlbums() {
    const div = await fetchHTML(`/songs/`);
    if (!div) return;

    const cardContainer = document.querySelector(".cardContainer");
    const anchors = Array.from(div.getElementsByTagName("a"));

    for (const anchor of anchors) {
        if (anchor.href.includes("/songs") && !anchor.href.includes(".htaccess")) {
            const folder = anchor.href.split("/").slice(-2)[0];
            const metadata = await fetchJSON(`/songs/${folder}/info.json`);

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${metadata.title || "Untitled Album"}</h2>
                    <p>${metadata.description || "No description available"}</p>
                </div>
            `;
        }
    }

    // Click to load album
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            await loadSongs(`songs/${card.dataset.folder}`);
            playTrack(songs[0]);
        });
    });
}

/** ---------- Player Controls ---------- **/

function bindPlayerControls() {
    const playBtn = document.getElementById("play");
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");
    const volumeIcon = document.querySelector(".volume img");
    const volumeSlider = document.querySelector(".range input");

    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "img/pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent =
            `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width);
        currentSong.currentTime = currentSong.duration * percent;
    });

    prevBtn.addEventListener("click", () => changeTrack(-1));
    nextBtn.addEventListener("click", () => changeTrack(1));

    volumeSlider.addEventListener("input", e => {
        currentSong.volume = e.target.value / 100;
        volumeIcon.src = currentSong.volume === 0 ? "img/mute.svg" : "img/volume.svg";
    });

    volumeIcon.addEventListener("click", () => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            volumeSlider.value = 0;
            volumeIcon.src = "img/mute.svg";
        } else {
            currentSong.volume = 0.1;
            volumeSlider.value = 10;
            volumeIcon.src = "img/volume.svg";
        }
    });
}

function changeTrack(direction) {
    const index = songs.indexOf(currentSong.src.split("/").pop());
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < songs.length) {
        playTrack(songs[newIndex]);
    }
}

/** ---------- Sidebar Menu ---------- **/

function bindMenuControls() {
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });
}

/** ---------- Initialize App ---------- **/

async function init() {
    await loadSongs("songs/ncs");
    playTrack(songs[0], true);
    await displayAlbums();
    bindPlayerControls();
    bindMenuControls();
}

init();
