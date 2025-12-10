import { useState, useEffect, useRef } from 'react';
import * as jsmediatags from 'jsmediatags'; // <--- NEW IMPORT
import './App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentCover, setCurrentCover] = useState(null); // <--- NEW STATE FOR IMAGE
  const [searchTerm, setSearchTerm] = useState(""); 
  const audioRef = useRef(null);

  // 1. Fetch Songs
  useEffect(() => {
    fetch('https://my-music-api-p380.onrender.com/songs') 
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Error:", err));
  }, []);

  // 2. Extract Album Art (The Magic Function)
  const extractArt = (song) => {
    // Reset to default while loading
    setCurrentCover(null); 
    
    // We use the 'jsmediatags' library to read the file header
    jsmediatags.read(song.songUrl, {
      onSuccess: (tag) => {
        const picture = tag.tags.picture;
        if (picture) {
          // Convert the raw data to a standard image URL
          const { data, format } = picture;
          let base64String = "";
          for (let i = 0; i < data.length; i++) {
            base64String += String.fromCharCode(data[i]);
          }
          const imageUri = `data:${format};base64,${window.btoa(base64String)}`;
          setCurrentCover(imageUri);
        } else {
          setCurrentCover(null); // No image found in file
        }
      },
      onError: (error) => {
        console.log("Art extraction error:", error);
        setCurrentCover(null);
      }
    });
  };

  // 3. Play Logic
  const playSong = (song) => {
    setCurrentSong(song);
    extractArt(song); // <--- TRIGGER EXTRACTION
  };

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentSong]);

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
          <ul>
            {filteredSongs.map((song) => (
              <li 
                key={song._id} 
                onClick={() => playSong(song)} 
                className={currentSong?._id === song._id ? 'active' : ''}
              >
                <div>
                  <span className="song-title">{song.title}</span>
                  <span className="song-artist">{song.artist}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* UPDATED PLAYER BAR WITH ART */}
        <div className="player-bar">
          
          {/* Album Art Box */}
          <div className="album-art">
            {currentCover ? (
              <img src={currentCover} alt="Album Art" />
            ) : (
              <div className="placeholder-art">🎵</div>
            )}
          </div>

          <div className="now-playing-info">
            {currentSong ? (
              <>
                <strong>{currentSong.title}</strong>
                <span>{currentSong.artist}</span>
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