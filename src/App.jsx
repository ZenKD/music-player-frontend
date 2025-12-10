import { useState, useEffect } from 'react';
import { useAudioPlayer } from './useAudio';
import * as jsmediatags from 'jsmediatags';
import './App.css';

const API_URL = 'https://my-music-api-p380.onrender.com'; 

function App() {
  const [view, setView] = useState('library'); 
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [currentCover, setCurrentCover] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, songId: null });

  // NEW UI STATES
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState("Loading lyrics...");

  const { 
    currentSong, queue, isPlaying, progress, duration, volume, loopMode, isShuffle,
    playTrack, togglePlay, nextTrack, prevTrack, adjustVolume, seek, toggleShuffle, toggleLoop
  } = useAudioPlayer();

  // Load Data
  const loadData = () => {
    fetch(`${API_URL}/songs`).then(res => res.json()).then(setSongs);
    fetch(`${API_URL}/playlists`).then(res => res.json()).then(setPlaylists);
  };
  useEffect(() => { loadData(); }, []);

  // Fetch Lyrics when song changes
  useEffect(() => {
    if (!currentSong || !showLyrics) return;
    setLyricsText("Searching for lyrics...");
    
    // Use free API to find lyrics
    fetch(`https://api.lyrics.ovh/v1/${currentSong.artist}/${currentSong.title}`)
      .then(res => res.json())
      .then(data => {
        setLyricsText(data.lyrics ? data.lyrics : "Lyrics not found for this track.");
      })
      .catch(() => setLyricsText("Could not load lyrics."));
  }, [currentSong, showLyrics]);

  // Album Art Extraction
  useEffect(() => {
    if(!currentSong) return;
    jsmediatags.read(currentSong.songUrl, {
      onSuccess: (tag) => {
        const picture = tag.tags.picture;
        if (picture) {
          const base64 = picture.data.map(char => String.fromCharCode(char)).join('');
          setCurrentCover(`data:${picture.format};base64,${window.btoa(base64)}`);
        } else setCurrentCover(null);
      },
      onError: () => setCurrentCover(null)
    });
  }, [currentSong]);

  // Handlers (Context Menu, Add Playlist, Sync) - Same as before
  const handleContextMenu = (e, songId) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, songId: songId });
  };
  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);
  const addToPlaylist = async (playlistId) => {
    await fetch(`${API_URL}/playlists/${playlistId}/add`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ songId: contextMenu.songId })
    });
    loadData();
  };
  const createPlaylist = async () => {
    const name = prompt("Enter playlist name:");
    if (name) {
      await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name })
      });
      loadData();
    }
  };
  const handleSync = async () => {
    await fetch(`${API_URL}/sync`, { method: 'POST' });
    loadData();
  };

  // Helper: Format Time
  const formatTime = (s) => {
    if (!s) return "0:00";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const songsDisplay = activePlaylist ? activePlaylist.songs : songs;
  const filteredSongs = songsDisplay.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="app-layout">
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">🎵 My Music</div>
        <div className="nav-links">
          <button onClick={() => { setActivePlaylist(null); setShowLyrics(false); setShowQueue(false); }}>🏠 Home</button>
          <button onClick={handleSync}>🔄 Sync Library</button>
        </div>
        <div className="playlists-section">
          <div className="playlist-header"><span>YOUR LIBRARY</span><button onClick={createPlaylist}>+</button></div>
          <div className="playlist-list">
            {playlists.map(pl => (
              <div key={pl._id} className={`playlist-item ${activePlaylist?._id === pl._id ? 'active' : ''}`} onClick={() => setActivePlaylist(pl)}>
                {pl.name}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (Switches between Library, Queue, Lyrics) */}
      <main className="main-view" style={showLyrics ? {background: 'linear-gradient(to bottom, #444, #111)'} : {}}>
        
        {/* --- VIEW 1: LYRICS --- */}
        {showLyrics ? (
          <div className="lyrics-view">
            <div className="lyrics-header">
              <img src={currentCover} className="lyrics-art" alt="" />
              <div>
                <h1>{currentSong?.title}</h1>
                <h3>{currentSong?.artist}</h3>
              </div>
            </div>
            <div className="lyrics-text">{lyricsText}</div>
          </div>
        ) : showQueue ? (
          
          /* --- VIEW 2: QUEUE --- */
          <div className="queue-view">
            <h1>Queue</h1>
            <h3>Now Playing</h3>
            <div className="queue-item active">
               {currentSong ? `${currentSong.title} - ${currentSong.artist}` : "Nothing playing"}
            </div>
            <h3>Next Up</h3>
            {queue.map((s, i) => (
              <div key={i} className="queue-item" onClick={() => playTrack(s)}>
                <span style={{color:'#888', marginRight:'10px'}}>{i+1}</span>
                {s.title} - <span style={{color:'#888'}}>{s.artist}</span>
              </div>
            ))}
          </div>
        ) : (

          /* --- VIEW 3: LIBRARY (Default) --- */
          <>
            <div className="main-header">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="playlist-banner">
              <div className="banner-art">{activePlaylist ? '📂' : '❤️'}</div>
              <div className="banner-info">
                <p>Playlist</p>
                <h1>{activePlaylist ? activePlaylist.name : "Liked Songs"}</h1>
                <p>{filteredSongs.length} songs</p>
              </div>
            </div>
            <div className="songs-table">
              <div className="table-header"><span>#</span><span>Title</span><span>Duration</span></div>
              {filteredSongs.map((song, index) => (
                <div 
                  key={song._id} 
                  className={`table-row ${currentSong?._id === song._id ? 'playing' : ''}`}
                  onClick={() => playTrack(song, filteredSongs)}
                  onContextMenu={(e) => handleContextMenu(e, song._id)}
                >
                  <span className="row-num">{currentSong?._id === song._id && isPlaying ? '🎵' : index + 1}</span>
                  <div className="row-title">
                    <span className="title-text">{song.title}</span>
                    <span className="artist-text">{song.artist}</span>
                  </div>
                  <span className="row-time">3:00</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* PLAYER BAR */}
      <footer className="player-bar">
        <div className="player-left">
          <div className="player-art">{currentCover ? <img src={currentCover} alt="" /> : <div className="placeholder">🎵</div>}</div>
          <div className="player-info">
            <h4>{currentSong?.title || "No Song"}</h4>
            <p>{currentSong?.artist || ""}</p>
          </div>
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button onClick={toggleShuffle} style={{color: isShuffle ? '#1db954' : '#b3b3b3'}}>🔀</button>
            <button onClick={prevTrack}>⏮</button>
            <button className="play-circle" onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={nextTrack}>⏭</button>
            
            {/* LOOP BUTTON (Changes icon based on mode) */}
            <button onClick={toggleLoop} style={{color: loopMode > 0 ? '#1db954' : '#b3b3b3', position:'relative'}}>
              🔁 {loopMode === 1 && <span className="loop-one-badge">1</span>}
            </button>
          </div>
          <div className="progress-container">
            <span>{formatTime(progress)}</span>
            <input type="range" min="0" max={duration || 0} value={progress} onChange={(e) => seek(e.target.value)} />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-right">
          {/* LYRICS BUTTON */}
          <button onClick={() => setShowLyrics(!showLyrics)} style={{color: showLyrics ? '#1db954' : '#b3b3b3'}}>🎤</button>
          
          {/* QUEUE BUTTON */}
          <button onClick={() => setShowQueue(!showQueue)} style={{color: showQueue ? '#1db954' : '#b3b3b3'}}>☰</button>
          
          <div className="volume-box">
             <span>🔊</span>
             <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => adjustVolume(e.target.value)} />
          </div>
        </div>
      </footer>

      {contextMenu.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          <div className="menu-header">Add to Playlist</div>
          {playlists.map(pl => (
            <div key={pl._id} className="menu-item" onClick={() => addToPlaylist(pl._id)}>{pl.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;