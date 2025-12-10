import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const audioRef = useRef(null);

  // 1. Fetch Data
  useEffect(() => {
    fetch('https://my-music-api.onrender.com/songs') 
      .then(res => res.json())
      .then(data => {
        console.log("Songs loaded:", data.length); // Debug log
        setSongs(data);
      })
      .catch(err => console.error("Error fetching songs:", err));
  }, []);

  // 2. Play Logic
  const playSong = (song) => {
    setCurrentSong(song);
  };

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentSong]);

  // 3. SAFE FILTER LOGIC (The Fix)
  // We check if title/artist exists before running toLowerCase()
  const filteredSongs = songs.filter(song => {
    const title = song.title ? song.title.toString().toLowerCase() : "";
    const artist = song.artist ? song.artist.toString().toLowerCase() : "";
    const search = searchTerm.toLowerCase();
    
    return title.includes(search) || artist.includes(search);
  });

  return (
    <div className="app-container">
      <header>
        <h1>🎵 My Music Server</h1>
        
        {/* Search Bar */}
        <input 
          type="text" 
          placeholder="Search songs..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '10px',
            borderRadius: '8px',
            border: '1px solid #333',
            background: '#333',
            color: 'white',
            fontSize: '16px',
            outline: 'none'
          }}
        />
      </header>

      <main>
        <div className="song-list">
          <h2>Library ({filteredSongs.length})</h2>
          
          {songs.length === 0 && <p>Loading library...</p>}

          <ul>
            {filteredSongs.map((song) => (
              <li 
                key={song._id} 
                onClick={() => playSong(song)} 
                className={currentSong?._id === song._id ? 'active' : ''}
              >
                <div className="song-info">
                  <span className="song-title">{song.title}</span>
                  <span className="song-artist">{song.artist}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Player Bar */}
        <div className="player-bar">
          <div className="now-playing">
            {currentSong ? (
              <>
                <strong style={{ display: 'block' }}>{currentSong.title}</strong>
                <span style={{ fontSize: '0.9em', color: '#b3b3b3' }}>{currentSong.artist}</span>
              </>
            ) : (
              <span>Select a song</span>
            )}
          </div>
          <audio ref={audioRef} src={currentSong?.songUrl} controls autoPlay />
        </div>
      </main>
    </div>
  );
}

export default App;