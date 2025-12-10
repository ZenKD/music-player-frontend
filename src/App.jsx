import { useState, useEffect, useRef } from 'react';
import UploadForm from './UploadForm'; // <--- IMPORT THIS
import './App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(null);

  // 1. Fetch songs from your Backend
  useEffect(() => {
    fetch('https://my-music-api-p380.onrender.com/songs')
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Error fetching songs:", err));
  }, []);

  // 2. Function to play a specific song
  const playSong = (song) => {
    setCurrentSong(song);
    // The audio element will automatically load the new src because of the useEffect below
  };

  // Move fetch logic to a function so we can reuse it
  const fetchSongs = () => {
    fetch('https://my-music-api.onrender.com/songs')
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // 3. Auto-play when the current song changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentSong]);

  return (
    <div className="app-container">
      <header>
        <h1>🎵 My Music Server</h1>
      </header>

      {/* Add the Upload Form Here */}
      <UploadForm onUploadSuccess={fetchSongs} />

      <main>
        {/* Song List */}
        <div className="song-list">
          <h2>Library</h2>
          {songs.length === 0 ? <p>Loading songs...</p> : null}
          
          <ul>
            {songs.map((song) => (
              <li key={song._id} onClick={() => playSong(song)} className={currentSong?._id === song._id ? 'active' : ''}>
                <span className="song-title">{song.title}</span>
                <span className="song-artist">{song.artist}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* The Player Controls */}
        <div className="player-bar">
          <div className="now-playing">
            {currentSong ? (
              <>
                <strong>{currentSong.title}</strong>
                <span>{currentSong.artist}</span>
              </>
            ) : (
              <span>Select a song to play</span>
            )}
          </div>
          
          <audio 
            ref={audioRef} 
            src={currentSong?.songUrl} 
            controls 
            autoPlay
          />
        </div>
      </main>
    </div>
  );
}

export default App;