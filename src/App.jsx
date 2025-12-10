import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // <--- NEW STATE
  const audioRef = useRef(null);

  useEffect(() => {
    fetch('https://my-music-api.onrender.com/songs') 
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Error fetching songs:", err));
  }, []);

  const playSong = (song) => {
    setCurrentSong(song);
  };

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentSong]);

  // FILTER LOGIC
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <header>
        <h1>🎵 My Music Server</h1>
        
        {/* NEW SEARCH INPUT */}
        <input 
          type="text" 
          placeholder="Search songs or artists..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '5px',
            border: 'none',
            fontSize: '16px'
          }}
        />
      </header>

      <main>
        <div className="song-list">
          <h2>Library ({filteredSongs.length})</h2>
          {songs.length === 0 ? <p>Loading songs...</p> : null}
          
          <ul>
            {filteredSongs.map((song) => (
              <li key={song._id} onClick={() => playSong(song)} className={currentSong?._id === song._id ? 'active' : ''}>
                <span className="song-title">{song.title}</span>
                <span className="song-artist">{song.artist}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="player-bar">
          <div className="now-playing">
            {currentSong ? (
              <><strong>{currentSong.title}</strong><span>{currentSong.artist}</span></>
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