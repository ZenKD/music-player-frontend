import { useState, useEffect } from 'react';
import { useAudioPlayer } from './useAudio';
import * as jsmediatags from 'jsmediatags';
import './App.css';

const API_URL = 'https://my-music-api-p380.onrender.com'; // CHECK YOUR URL

function App() {
  const [view, setView] = useState('library');
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [currentCover, setCurrentCover] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { 
    currentSong, isPlaying, playTrack, togglePlay, nextTrack, prevTrack, toggleShuffle, isShuffle 
  } = useAudioPlayer();

  // Load Data
  const loadData = () => {
    fetch(`${API_URL}/songs`).then(res => res.json()).then(setSongs);
    fetch(`${API_URL}/playlists`).then(res => res.json()).then(setPlaylists);
  };

  useEffect(() => { loadData(); }, []);

  // --- THE SYNC BUTTON FUNCTION ---
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_URL}/sync`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      loadData(); // Refresh list immediately
    } catch (err) {
      alert("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  // Album Art Extraction
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

  // Playlist Logic
  const createPlaylist = async () => {
    if (!newPlaylistName) return;
    await fetch(`${API_URL}/playlists`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name: newPlaylistName })
    });
    setNewPlaylistName("");
    loadData();
  };

  const addToPlaylist = async (songId, playlistId) => {
    await fetch(`${API_URL}/playlists/${playlistId}/add`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ songId })
    });
    alert("Added!");
  };

  const openPlaylist = (playlist) => {
    setSongs(playlist.songs); // Only show playlist songs
    setView('library');
    setSelectedPlaylist(playlist.name);
  };

  return (
    <div className="app-container">
      <header>
        <h1>🎵 My Music DB</h1>
        <div className="nav-buttons">
          <button onClick={() => { setView('library'); setSelectedPlaylist(null); loadData(); }}>All Songs</button>
          <button onClick={() => setView('playlists')}>Playlists</button>
          {/* SYNC BUTTON */}
          <button onClick={handleSync} style={{background: '#444'}}>
            {isSyncing ? "Syncing..." : "🔄 Sync Library"}
          </button>
        </div>
      </header>

      {view === 'playlists' && (
        <div className="playlist-manager">
          <div className="create-box">
            <input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="Playlist Name" />
            <button onClick={createPlaylist}>Create</button>
          </div>
          <ul>
            {playlists.map(pl => (
              <li key={pl._id} onClick={() => openPlaylist(pl)}>
                📂 {pl.name} <span style={{fontSize:'0.8em', color:'#888'}}>({pl.songs.length} songs)</span>
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
                {/* Add to Playlist Dropdown (Simple version: click to add to first playlist) */}
                {playlists.length > 0 && (
                  <button className="add-btn" onClick={(e) => { 
                    e.stopPropagation(); 
                    // For now, simple "Add to first playlist" - you can make a dropdown later
                    addToPlaylist(song._id, playlists[0]._id); 
                  }}>
                    + {playlists[0].name}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </main>
      )}

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