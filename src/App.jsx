import { useState, useEffect, useRef } from 'react';
import { useAudioPlayer } from './useAudio';
import * as jsmediatags from 'jsmediatags';
import './App.css';

const API_URL = 'https://my-music-api-p380.onrender.com'; 

function App() {
  // --- STATE ---
  const [view, setView] = useState('library'); // 'library' or 'playlist'
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null); // The playlist currently OPEN in middle view
  const [currentCover, setCurrentCover] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Right Click Menu State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, songId: null });

  const { 
    currentSong, isPlaying, progress, duration, volume,
    playTrack, togglePlay, nextTrack, prevTrack, adjustVolume, seek, toggleShuffle, isShuffle 
  } = useAudioPlayer();

  // --- DATA LOADING ---
  const loadData = () => {
    fetch(`${API_URL}/songs`).then(res => res.json()).then(setSongs);
    fetch(`${API_URL}/playlists`).then(res => res.json()).then(setPlaylists);
  };

  useEffect(() => { loadData(); }, []);

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

  // --- EVENT HANDLERS ---

  // Handle Right Click on Song
  const handleContextMenu = (e, songId) => {
    e.preventDefault(); // Stop default browser menu
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      songId: songId
    });
  };

  // Close menu when clicking anywhere else
  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  // Add Song to Playlist
  const addToPlaylist = async (playlistId) => {
    await fetch(`${API_URL}/playlists/${playlistId}/add`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ songId: contextMenu.songId })
    });
    // Refresh to see update if we are looking at that playlist
    loadData(); 
  };

  // Create Playlist
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

  // Filter Logic
  const songsDisplay = activePlaylist ? activePlaylist.songs : songs;
  const filteredSongs = songsDisplay.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Time Formatter (0:00)
  const formatTime = (s) => {
    if (!s) return "0:00";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="app-layout">
      
      {/* --- 1. SIDEBAR (Left) --- */}
      <aside className="sidebar">
        <div className="logo">🎵 My Music</div>
        
        <div className="nav-links">
          <button onClick={() => { setActivePlaylist(null); setView('library'); }} className={!activePlaylist ? 'active' : ''}>
            🏠 Home
          </button>
          <button onClick={handleSync}>🔄 Sync Library</button>
        </div>

        <div className="playlists-section">
          <div className="playlist-header">
            <span>YOUR LIBRARY</span>
            <button onClick={createPlaylist}>+</button>
          </div>
          <div className="playlist-list">
            {playlists.map(pl => (
              <div 
                key={pl._id} 
                className={`playlist-item ${activePlaylist?._id === pl._id ? 'active' : ''}`}
                onClick={() => setActivePlaylist(pl)}
              >
                {pl.name}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* --- 2. MAIN CONTENT (Center) --- */}
      <main className="main-view">
        {/* Header / Search */}
        <div className="main-header">
          <input 
            type="text" 
            placeholder="What do you want to play?" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Playlist Banner */}
        <div className="playlist-banner" style={{background: activePlaylist ? 'linear-gradient(transparent, rgba(0,0,0,0.5))' : '#222'}}>
          <div className="banner-art">
            {activePlaylist ? '📂' : '❤️'}
          </div>
          <div className="banner-info">
            <p>Playlist</p>
            <h1>{activePlaylist ? activePlaylist.name : "Liked Songs"}</h1>
            <p>{filteredSongs.length} songs</p>
          </div>
        </div>

        {/* Controls Row */}
        <div className="action-bar">
          <button className="big-play-btn" onClick={() => playTrack(filteredSongs[0], filteredSongs)}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="action-btn" onClick={toggleShuffle} style={{color: isShuffle ? '#1db954' : '#b3b3b3'}}>🔀</button>
        </div>

        {/* Songs List */}
        <div className="songs-table">
          <div className="table-header">
            <span>#</span>
            <span>Title</span>
            <span>Date Added</span>
            <span>Duration</span>
          </div>
          {filteredSongs.map((song, index) => (
            <div 
              key={song._id} 
              className={`table-row ${currentSong?._id === song._id ? 'playing' : ''}`}
              onClick={() => playTrack(song, filteredSongs)}
              onContextMenu={(e) => handleContextMenu(e, song._id)} // RIGHT CLICK TRIGGER
            >
              <span className="row-num">{currentSong?._id === song._id && isPlaying ? '🎵' : index + 1}</span>
              <div className="row-title">
                <span className="title-text">{song.title}</span>
                <span className="artist-text">{song.artist}</span>
              </div>
              <span className="row-date">Dec 10, 2025</span>
              <span className="row-time">3:45</span>
            </div>
          ))}
        </div>
      </main>

      {/* --- 3. PLAYER BAR (Bottom) --- */}
      <footer className="player-bar">
        {/* Left: Info */}
        <div className="player-left">
          <div className="player-art">
             {currentCover ? <img src={currentCover} alt="" /> : <div className="placeholder">🎵</div>}
          </div>
          <div className="player-info">
            <h4>{currentSong?.title || "No Song"}</h4>
            <p>{currentSong?.artist || "Select a song"}</p>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="player-center">
          <div className="player-controls">
            <button onClick={toggleShuffle} style={{color: isShuffle ? '#1db954' : '#b3b3b3'}}>🔀</button>
            <button onClick={prevTrack}>⏮</button>
            <button className="play-circle" onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={nextTrack}>⏭</button>
            <button>🔁</button>
          </div>
          <div className="progress-container">
            <span>{formatTime(progress)}</span>
            <input 
              type="range" 
              min="0" max={duration || 0} 
              value={progress} 
              onChange={(e) => seek(e.target.value)}
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="player-right">
          <span>🔊</span>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={volume} 
            onChange={(e) => adjustVolume(e.target.value)}
          />
        </div>
      </footer>

      {/* --- 4. CONTEXT MENU (Hidden Overlay) --- */}
      {contextMenu.visible && (
        <div 
          className="context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <div className="menu-header">Add to Playlist</div>
          {playlists.map(pl => (
            <div key={pl._id} className="menu-item" onClick={() => addToPlaylist(pl._id)}>
              {pl.name}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default App;