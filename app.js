let currentAudio = new Audio();
let isPlaying = false;
let appData = {};

// Variáveis para sabermos sempre onde estamos na lista (para o AutoPlay)
let currentPlaylist = [];
let currentTrackIndex = 0;

const initApp = async () => {
    try {
        const res = await fetch('data.json'); 
        appData = await res.json();
        
        renderArtists(appData.artists);
        renderCatalog(appData.catalog);
        setupTabs();
        setupPlayer();
    } catch (error) {
        console.error("Erro a carregar dados:", error);
    }
};

// --- GESTÃO DE ABAS ---
const setupTabs = () => {
    const btnArtists = document.getElementById('tab-artists');
    const btnCatalog = document.getElementById('tab-catalog');
    const viewArtists = document.getElementById('view-artists');
    const viewCatalog = document.getElementById('view-catalog');
    const bgContainer = document.getElementById('artist-bg');

    btnArtists.addEventListener('click', () => {
        btnArtists.classList.add('active');
        btnCatalog.classList.remove('active');
        viewArtists.classList.remove('hidden');
        viewCatalog.classList.add('hidden');
        bgContainer.style.opacity = '0.35';
    });

    btnCatalog.addEventListener('click', () => {
        btnCatalog.classList.add('active');
        btnArtists.classList.remove('active');
        viewCatalog.classList.remove('hidden');
        viewArtists.classList.add('hidden');
        bgContainer.style.opacity = '0';
    });
};

// --- RENDERIZAR ARTISTAS ---
const renderArtists = (artists) => {
    const listContainer = document.getElementById('artist-list');
    const bgContainer = document.getElementById('artist-bg');

    // Cria uma mini-playlist com as 4 músicas de destaque
    const featuredPlaylist = artists.map(a => ({
        title: a.featuredTrack.title,
        artist: a.name,
        file: a.featuredTrack.file,
        image: a.image
    }));

    artists.forEach((artist, index) => {
        const item = document.createElement('div');
        item.classList.add('artist-item');
        if (index === 0) item.classList.add('active');
        item.innerText = artist.name;

        item.addEventListener('click', () => {
            document.querySelectorAll('.artist-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            bgContainer.style.backgroundImage = `url(${artist.image})`;
            
            playFromPlaylist(featuredPlaylist, index);
        });

        listContainer.appendChild(item);
    });

    if (artists.length > 0) {
        bgContainer.style.backgroundImage = `url(${artists[0].image})`;
        // Prepara a primeira faixa sem a tocar automaticamente
        currentPlaylist = featuredPlaylist;
        currentTrackIndex = 0;
        updatePlayerInfo(featuredPlaylist[0].title, featuredPlaylist[0].artist);
        loadTrack(featuredPlaylist[0].file, false);
        setupMediaSession(featuredPlaylist[0]);
    }
};

// --- RENDERIZAR CATÁLOGO ---
const renderCatalog = (catalogTracks) => {
    const catalogList = document.getElementById('catalog-list');

    // Cria a playlist gigante com as 30 músicas
    const catalogPlaylist = catalogTracks.map(track => ({
        title: track.title,
        artist: track.credits,
        file: track.file
    }));

    catalogTracks.forEach((track, index) => {
        const li = document.createElement('li');
        li.classList.add('catalog-item');
        
        const formatTitle = track.title.replace(/(\(.*?\))/g, '<span class="feat-text">$1</span>');
        
        li.innerHTML = `
            <span class="cat-title">${formatTitle}</span>
            <span class="cat-credits">${track.credits}</span>
        `;

        li.addEventListener('click', () => {
            playFromPlaylist(catalogPlaylist, index);
        });

        catalogList.appendChild(li);
    });
};

// --- LÓGICA DE PLAYLIST E AUTOPLAY ---
const playFromPlaylist = (playlist, index) => {
    currentPlaylist = playlist;
    currentTrackIndex = index;
    const track = playlist[index];
    
    updatePlayerInfo(track.title, track.artist);
    loadTrack(track.file, true);
    setupMediaSession(track);
};

const playNextTrack = () => {
    if (currentPlaylist.length === 0) return;
    // Salta para a próxima, ou volta à primeira se chegar ao fim
    currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    playFromPlaylist(currentPlaylist, currentTrackIndex);
};

const playPrevTrack = () => {
    if (currentPlaylist.length === 0) return;
    // Volta atrás
    currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playFromPlaylist(currentPlaylist, currentTrackIndex);
};

// --- INTEGRAÇÃO COM O ECRÃ DE BLOQUEIO DO iOS/ANDROID ---
const setupMediaSession = (track) => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: 'Red Velvet Records'
        });

        // Liga os comandos do telemóvel às nossas funções do site
        navigator.mediaSession.setActionHandler('play', playTrack);
        navigator.mediaSession.setActionHandler('pause', pauseTrack);
        navigator.mediaSession.setActionHandler('previoustrack', playPrevTrack);
        navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);
    }
};

// --- MOTOR DO PLAYER ---
const updatePlayerInfo = (title, artist) => {
    document.getElementById('track-name').innerText = title;
    document.getElementById('track-artist').innerText = artist;
    document.getElementById('full-track-name').innerText = title;
    document.getElementById('full-track-artist').innerText = artist;
};

const loadTrack = (fileUrl, autoPlay = false) => {
    currentAudio.src = fileUrl;
    currentAudio.load();
    document.querySelector('.progress-bar:not(.full-progress-bar)').style.width = '0%';
    document.querySelector('.full-progress-bar').style.width = '0%';
    
    if (autoPlay) playTrack();
    else pauseTrack();
};

const playTrack = () => {
    currentAudio.play().then(() => {
        isPlaying = true;
        document.getElementById('play-pause').innerHTML = '❚❚\uFE0E';
        document.getElementById('full-play-pause').innerHTML = '❚❚\uFE0E';
    }).catch(err => console.log("O AutoPlay foi bloqueado pelo navegador", err));
};

const pauseTrack = () => {
    currentAudio.pause();
    isPlaying = false;
    document.getElementById('play-pause').innerHTML = '►\uFE0E';
    document.getElementById('full-play-pause').innerHTML = '►\uFE0E';
};

const setupPlayer = () => {
    const miniPlayBtn = document.getElementById('play-pause');
    const miniProgressContainer = document.querySelector('.progress-container:not(.full-progress-container)');
    const miniProgressBar = document.querySelector('.progress-bar:not(.full-progress-bar)');
    
    const fullPlayBtn = document.getElementById('full-play-pause');
    const fullPrevBtn = document.getElementById('full-prev');
    const fullNextBtn = document.getElementById('full-next');
    const fullProgressContainer = document.querySelector('.full-progress-container');
    const fullProgressBar = document.querySelector('.full-progress-bar');
    
    const miniPlayerInfo = document.querySelector('.player-info');
    const fullPlayer = document.getElementById('full-player');
    const closePlayerBtn = document.getElementById('close-player');

    // Abre e fecha o player gigante
    miniPlayerInfo.addEventListener('click', () => fullPlayer.classList.add('open'));
    closePlayerBtn.addEventListener('click', () => fullPlayer.classList.remove('open'));

    // Botões de Play/Pause e Saltos
    const togglePlay = () => isPlaying ? pauseTrack() : playTrack();
    miniPlayBtn.addEventListener('click', togglePlay);
    fullPlayBtn.addEventListener('click', togglePlay);
    fullPrevBtn.addEventListener('click', playPrevTrack);
    fullNextBtn.addEventListener('click', playNextTrack);

    // Barras de progresso
    currentAudio.addEventListener('timeupdate', () => {
        if (currentAudio.duration) {
            const progressPercent = (currentAudio.currentTime / currentAudio.duration) * 100;
            miniProgressBar.style.width = `${progressPercent}%`;
            fullProgressBar.style.width = `${progressPercent}%`;
        }
    });

    const seekTrack = (e, container) => {
        if (currentAudio.duration) {
            currentAudio.currentTime = (e.offsetX / container.clientWidth) * currentAudio.duration;
        }
    };
    miniProgressContainer.addEventListener('click', (e) => seekTrack(e, miniProgressContainer));
    fullProgressContainer.addEventListener('click', (e) => seekTrack(e, fullProgressContainer));

    // A MÁGICA DO AUTOPLAY: Quando a música acaba, chama a próxima automaticamente!
    currentAudio.addEventListener('ended', playNextTrack);
};

document.addEventListener('DOMContentLoaded', initApp);