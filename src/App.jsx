import { useState, useEffect } from 'react';
import { useAudioPlayer } from './useAudioPlayer'; // Import our new logic
import * as jsmediatags from 'jsmediatags';
import './App.css';

const API_URL = 'https://my-music-api-p380.onrender.com'; // CHECK YOUR URL

function App() {
  const [view, setView] = useState('library'); // 'library' or 'playlists'
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [currentCover, setCurrentCover] = useState(null);
  
  // The Player Logic
  const { 
    currentSong, isPlaying, playTrack, togglePlay, nextTrack, prevTrack, toggleShuffle, isShuffle 
  } = useAudioPlayer();

  // Load Initial Data
  useEffect(() => {
    fetch(`${API_URL}/songs`).then(res => res.json()).then(setSongs);
    fetch(`${API_URL}/playlists`).then(res => res.json()).then(setPlaylists);
  }, []);

  // Extract Art (Same as before)
  useEffect(() => {
    if(!currentSong) return;
    jsmediatags.read(currentSong.songUrl, {
      onSuccess: (tag) => {
        const picture = tag.tags.picture;
        if (picture) {
          const base64String = picture.data.map(char => String.fromCharCode(char)).join('');
          setCurrentCover(`data:${picture.format};base64,${window.btoa(base64String)}`);
        } else setCurrentCover(null);
      },
      onError: () => setCurrentCover(null)
    });
  }, [currentSong]);

  // Playlist Functions
  const createPlaylist = async () => {
    if (!newPlaylistName) return;
    // For simplicity, creating a playlist starts empty or with current song
    // Here we just create an empty file first
    await fetch(`${API_URL}/playlists`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name: newPlaylistName, songs: [] })
    });
    setNewPlaylistName("");
    // Refresh list
    fetch(`${API_URL}/playlists`).then(res => res.json()).then(setPlaylists);
  };

  const addToPlaylist = async (song, playlistName) => {
    // 1. Get current playlist
    const res = await fetch(`${API_URL}/playlists/${playlistName}`);
    const currentSongs = await res.json();
    
    // 2. Add new song
    const updatedSongs = [...currentSongs, song];
    
    // 3. Save back
    await fetch(`${API_URL}/playlists`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name: playlistName, songs: updatedSongs })
    });
    alert(`Added to ${playlistName}`);
  };

  const openPlaylist = async (name) => {
    const res = await fetch(`${API_URL}/playlists/${name}`);
    const data = await res.json();
    setSongs(data); // Temporarily replace the "Library" view with Playlist songs
    setView('library');
    setSelectedPlaylist(name);
  };

  return (
    <div className="app-container">
      <header>
        <h1>🎵 My Music Cloud</h1>
        <div className="nav-buttons">
          <button onClick={() => { setView('library'); setSelectedPlaylist(null); fetch(`${API_URL}/songs`).then(res => res.json()).then(setSongs); }}>All Songs</button>
          <button onClick={() => setView('playlists')}>Playlists</button>
        </div>
      </header>

      {view === 'playlists' && (
        <div className="playlist-manager">
          <div className="create-box">
            <input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="New Playlist Name" />
            <button onClick={createPlaylist}>Create</button>
          </div>
          <ul>
            {playlists.map(pl => (
              <li key={pl.name} onClick={() => openPlaylist(pl.name)}>
                📂 {pl.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === 'library' && (
        <main>
          <h2>{selectedPlaylist ? `📂 ${selectedPlaylist}` : "Library"}</h2>
          <ul>
            {songs.map((song) => (
              <li key={song._id}>
                <div onClick={() => playTrack(song, songs)} style={{flexGrow: 1}}>
                  <span className="song-title">{song.title}</span>
                  <span className="song-artist">{song.artist}</span>
                </div>
                {/* Quick "Add to Playlist" Button (Demo: Adds to first playlist found) */}
                {playlists.length > 0 && (
                  <button className="add-btn" onClick={(e) => { e.stopPropagation(); addToPlaylist(song, playlists[0].name); }}>
                    + {playlists[0].name}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </main>
      )}

      {/* NEW PLAYER BAR WITH CONTROLS */}
      <div className="player-bar">
        <div className="album-art">
          {currentCover ? <img src={currentCover} /> : <div className="placeholder-art">🎵</div>}
        </div>

        <div className="controls">
          <button onClick={prevTrack}>⏮</button>
          <button onClick={togglePlay}>{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={nextTrack}>⏭</button>
          <button onClick={toggleShuffle} style={{color: isShuffle ? '#1db954' : 'white'}}>🔀</button>
        </div>

        <div className="now-playing-info">
          {currentSong ? (
            <><strong>{currentSong.title}</strong><span>{currentSong.artist}</span></>
          ) : <span>Select a song</span>}
        </div>
      </div>
    </div>
  );
}

export default App;