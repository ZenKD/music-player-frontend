import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const audioRef = useRef(null);

  // Fetch songs from Render
  useEffect(() => {
    fetch('https://my-music-api.onrender.com/songs') 
      .then(res => res.json())
      .then(data => {
        console.log("Songs loaded:", data);
        setSongs(data);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  const playSong = (song) => {
    setCurrentSong(song);
  };

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentSong]);

  // Safe Filter Logic
  const filteredSongs = songs.filter(song => {
    const title = song.title ? song.title.toString().toLowerCase() : "";
    const artist = song.artist ? song.artist.toString().toLowerCase() : "";
    const search = searchTerm.toLowerCase();
    return title.includes(search) || artist.includes(search);
  });

  return (
    <div className="app-container">
      <header>
        <h1>🎵 My Music Cloud</h1>
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px', width: '100%', borderRadius: '5px', border: 'none', marginTop: '10px' }}
        />
      </header>

      <main>
        <div className="song-list">
          <h2>Library ({filteredSongs.length})</h2>
          {songs.length === 0 && <p style={{color: '#888'}}>Loading library from Cloudflare...</p>}

          <ul>
            {filteredSongs.map((song) => (
              <li key={song._id} onClick={() => playSong(song)} className={currentSong?._id === song._id ? 'active' : ''}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <span className="song-title" style={{fontWeight: 'bold'}}>{song.title}</span>
                  <span className="song-artist" style={{fontSize: '0.8em', color: '#ccc'}}>{song.artist}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="player-bar">
          <div className="now-playing">
            {currentSong ? (
              <><strong>{currentSong.title}</strong><br/>{currentSong.artist}</>
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