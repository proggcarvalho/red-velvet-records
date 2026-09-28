let currentAudio = new Audio();
let isPlaying = false;
let appData = {};

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
        bgContainer.style.opacity = '0.15'; // Mostra a textura de fundo
    });

    btnCatalog.addEventListener('click', () => {
        btnCatalog.classList.add('active');
        btnArtists.classList.remove('active');
        viewCatalog.classList.remove('hidden');
        viewArtists.classList.add('hidden');
        bgContainer.style.opacity = '0'; // Esconde a foto de fundo para o catálogo ficar limpo
    });
};

// --- RENDERIZAR ARTISTAS (Aba 1) ---
const renderArtists = (artists) => {
    const listContainer = document.getElementById('artist-list');
    const bgContainer = document.getElementById('artist-bg');

    artists.forEach((artist, index) => {
        const item = document.createElement('div');
        item.classList.add('artist-item');
        if (index === 0) item.classList.add('active');
        
        item.innerText = artist.name;

        item.addEventListener('click', () => {
            document.querySelectorAll('.artist-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            bgContainer.style.backgroundImage = `url(${artist.image})`;
            
            updatePlayerInfo(artist.featuredTrack.title, artist.name);
            loadTrack(artist.featuredTrack.file, true); 
        });

        listContainer.appendChild(item);
    });

    if (artists.length > 0) {
        updatePlayerInfo(artists[0].featuredTrack.title, artists[0].name);
        bgContainer.style.backgroundImage = `url(${artists[0].image})`;
        loadTrack(artists[0].featuredTrack.file, false); 
    }
};

// --- RENDERIZAR CATÁLOGO (Aba 2) ---
const renderCatalog = (catalogTracks) => {
    const catalogList = document.getElementById('catalog-list');

    catalogTracks.forEach(track => {
        const li = document.createElement('li');
        li.classList.add('catalog-item');
        
        // Expressão regular para encontrar texto entre parênteses e envolvê-lo num span
        const formatTitle = track.title.replace(/(\(.*?\))/g, '<span class="feat-text">$1</span>');
        
        li.innerHTML = `
            <span class="cat-title">${formatTitle}</span>
            <span class="cat-credits">${track.credits}</span>
        `;

        li.addEventListener('click', () => {
            updatePlayerInfo(track.title, track.credits);
            loadTrack(track.file, true);
        });

        catalogList.appendChild(li);
    });
};

// --- MOTOR DO PLAYER ---
const updatePlayerInfo = (title, artist) => {
    // Atualiza a barra de rodapé
    document.getElementById('track-name').innerText = title;
    document.getElementById('track-artist').innerText = artist;
    
    // Atualiza o ecrã expansível
    document.getElementById('full-track-name').innerText = title;
    document.getElementById('full-track-artist').innerText = artist;
};

const loadTrack = (fileUrl, autoPlay = false) => {
    currentAudio.src = fileUrl;
    currentAudio.load();
    document.querySelector('.progress-bar').style.width = '0%';
    document.querySelector('.full-progress-bar').style.width = '0%';
    
    if (autoPlay) playTrack();
    else pauseTrack();
};

const playTrack = () => {
    currentAudio.play();
    isPlaying = true;
    document.getElementById('play-pause').innerHTML = '❚❚\uFE0E';
    document.getElementById('full-play-pause').innerHTML = '❚❚\uFE0E';
};

const pauseTrack = () => {
    currentAudio.pause();
    isPlaying = false;
    document.getElementById('play-pause').innerHTML = '▶\uFE0E';
    document.getElementById('full-play-pause').innerHTML = '▶\uFE0E';
};

const setupPlayer = () => {
    // Elementos da barra pequena
    const miniPlayBtn = document.getElementById('play-pause');
    const miniProgressContainer = document.querySelector('.progress-container:not(.full-progress-container)');
    const miniProgressBar = document.querySelector('.progress-bar:not(.full-progress-bar)');
    
    // Elementos do player gigante
    const fullPlayBtn = document.getElementById('full-play-pause');
    const fullProgressContainer = document.querySelector('.full-progress-container');
    const fullProgressBar = document.querySelector('.full-progress-bar');
    
    const miniPlayerInfo = document.querySelector('.player-info');
    const fullPlayer = document.getElementById('full-player');
    const closePlayerBtn = document.getElementById('close-player');

    // 1. Abrir e Fechar o Ecrã Inteiro
    miniPlayerInfo.addEventListener('click', () => {
        fullPlayer.classList.add('open');
    });
    
    closePlayerBtn.addEventListener('click', () => {
        fullPlayer.classList.remove('open');
    });

    // 2. Botões de Play/Pause (Ambos)
    const togglePlay = () => isPlaying ? pauseTrack() : playTrack();
    miniPlayBtn.addEventListener('click', togglePlay);
    fullPlayBtn.addEventListener('click', togglePlay);

    // 3. Animar as duas barras de progresso
    currentAudio.addEventListener('timeupdate', () => {
        if (currentAudio.duration) {
            const progressPercent = (currentAudio.currentTime / currentAudio.duration) * 100;
            miniProgressBar.style.width = `${progressPercent}%`;
            fullProgressBar.style.width = `${progressPercent}%`;
        }
    });

    // 4. Clicar nas barras para avançar
    const seekTrack = (e, container) => {
        if (currentAudio.duration) {
            currentAudio.currentTime = (e.offsetX / container.clientWidth) * currentAudio.duration;
        }
    };
    miniProgressContainer.addEventListener('click', (e) => seekTrack(e, miniProgressContainer));
    fullProgressContainer.addEventListener('click', (e) => seekTrack(e, fullProgressContainer));

    // 5. Reset quando acaba (temporário, antes de metermos o autoplay)
    currentAudio.addEventListener('ended', () => {
        pauseTrack();
        miniProgressBar.style.width = '0%';
        fullProgressBar.style.width = '0%';
    });
};

// Arranca a máquina
document.addEventListener('DOMContentLoaded', initApp);