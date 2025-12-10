import { useState, useEffect } from 'react';
import { useAudioPlayer } from './useAudio';
import * as jsmediatags from 'jsmediatags';
import './App.css';

// --- NEW ICONS ---
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ShuffleOnIcon from '@mui/icons-material/ShuffleOn';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOnIcon from '@mui/icons-material/RepeatOn';
import LyricsIcon from '@mui/icons-material/Lyrics';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import HomeIcon from '@mui/icons-material/Home';
import SyncIcon from '@mui/icons-material/Sync';
import AddIcon from '@mui/icons-material/Add';

const API_URL = 'https://my-music-api-p380.onrender.com'; 

function App() {
  const [view, setView] = useState('library'); 
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [currentCover, setCurrentCover] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, songId: null });

  // UI STATES
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState("Loading...");

  const { 
    currentSong, queue, isPlaying, progress, duration, volume, loopMode, isShuffle,
    playTrack, togglePlay, nextTrack, prevTrack, adjustVolume, seek, toggleShuffle, toggleLoop
  } = useAudioPlayer();

  const loadData = () => {
    fetch(`${API_URL}/songs`).then(res => res.json()).then(setSongs);
    fetch(`${API_URL}/playlists`).then(res => res.json()).then(setPlaylists);
  };
  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!currentSong || !showLyrics) return;
    setLyricsText("Searching...");
    fetch(`https://api.lyrics.ovh/v1/${currentSong.artist}/${currentSong.title}`)
      .then(res => res.json())
      .then(data => setLyricsText(data.lyrics || "Lyrics not found."))
      .catch(() => setLyricsText("Lyrics not available."));
  }, [currentSong, showLyrics]);

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

  const handleContextMenu = (e, songId) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, songId });
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
    const name = prompt("Playlist Name:");
    if(name) {
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
      <div className="sidebar">
        <div className="logo">🎵 Music</div>
        <div className="nav-links">
          <button onClick={() => { setActivePlaylist(null); setShowLyrics(false); setShowQueue(false); }}>
            <HomeIcon style={{fontSize: 20, verticalAlign:'middle', marginRight: 10}}/> Home
          </button>
          <button onClick={handleSync}>
            <SyncIcon style={{fontSize: 20, verticalAlign:'middle', marginRight: 10}}/> Sync
          </button>
        </div>
        <div className="playlists-section">
          <div style={{marginBottom: '10px', color:'#b3b3b3', fontSize:'12px', fontWeight:'bold', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            PLAYLISTS 
            <AddIcon onClick={createPlaylist} style={{cursor:'pointer', fontSize: 18}}/>
          </div>
          <div className="playlist-list">
            {playlists.map(pl => (
              <div key={pl._id} className={activePlaylist?._id === pl._id ? 'active' : ''} onClick={() => setActivePlaylist(pl)}>
                {pl.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-view">
        {showLyrics ? (
          <div className="lyrics-view">
            <img src={currentCover} style={{width:200, height:200, borderRadius:10, marginBottom:20}} />
            <div className="lyrics-text">{lyricsText}</div>
          </div>
        ) : showQueue ? (
          <div className="queue-view">
            <h1>Queue</h1>
            {queue.map((s, i) => (
              <div key={i} className="queue-item" onClick={() => playTrack(s)}>
                {i+1}. {s.title} - {s.artist}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="main-header">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="playlist-banner">
              <div className="banner-art">{activePlaylist ? '📂' : '❤️'}</div>
              <div>
                <p>PLAYLIST</p>
                <h1>{activePlaylist ? activePlaylist.name : "Liked Songs"}</h1>
                <p>{filteredSongs.length} songs</p>
              </div>
            </div>

            <div className="songs-table">
              {filteredSongs.map((song, index) => (
                <div 
                  key={song._id} 
                  className={`table-row ${currentSong?._id === song._id ? 'playing' : ''}`}
                  onClick={() => playTrack(song, filteredSongs)}
                  onContextMenu={(e) => handleContextMenu(e, song._id)}
                >
                  <span>{index + 1}</span>
                  <div className="row-title">
                    <span className="title-text">{song.title}</span>
                    <span className="artist-text">{song.artist}</span>
                  </div>
                  <span>3:45</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* PLAYER BAR */}
      <div className="player-bar">
        <div className="player-left">
          <div className="player-art">{currentCover && <img src={currentCover} />}</div>
          <div>
             <div style={{color:'#fff', fontWeight:'bold', fontSize:'14px'}}>{currentSong?.title}</div>
             <div style={{color:'#b3b3b3', fontSize:'12px'}}>{currentSong?.artist}</div>
          </div>
        </div>

        <div className="player-center">
           <div className="player-controls">
              {/* SHUFFLE */}
              <button onClick={toggleShuffle} style={{color: isShuffle ? '#1db954' : '#b3b3b3'}}>
                {isShuffle ? <ShuffleOnIcon/> : <ShuffleIcon/>}
              </button>

              <button onClick={prevTrack}><SkipPreviousIcon style={{fontSize: 28}}/></button>
              
              {/* PLAY / PAUSE */}
              <button className="play-circle" onClick={togglePlay} style={{background:'none', color:'#fff'}}>
                {isPlaying ? <PauseCircleIcon style={{fontSize: 40}}/> : <PlayCircleIcon style={{fontSize: 40}}/>}
              </button>
              
              <button onClick={nextTrack}><SkipNextIcon style={{fontSize: 28}}/></button>
              
              {/* LOOP */}
              <button onClick={toggleLoop} style={{color: loopMode > 0 ? '#1db954' : '#b3b3b3', position:'relative'}}>
                {loopMode > 0 ? <RepeatOnIcon/> : <RepeatIcon/>}
                {loopMode === 1 && <span className="loop-one-badge">1</span>}
              </button>
           </div>
           
           <div className="progress-container">
              <span>{formatTime(progress)}</span>
              <input type="range" min="0" max={duration || 0} value={progress} onChange={(e) => seek(e.target.value)} />
              <span>{formatTime(duration)}</span>
           </div>
        </div>

        <div className="player-right">
           {/* LYRICS */}
           <button onClick={() => setShowLyrics(!showLyrics)} style={{color: showLyrics ? '#1db954' : '#b3b3b3'}}>
             <LyricsIcon/>
           </button>
           
           {/* QUEUE */}
           <button onClick={() => setShowQueue(!showQueue)} style={{color: showQueue ? '#1db954' : '#b3b3b3'}}>
             <QueueMusicIcon/>
           </button>
           
           {/* VOLUME */}
           <div style={{display:'flex', alignItems:'center', gap: 5}}>
             {volume == 0 ? <VolumeOffIcon style={{fontSize:20}}/> : <VolumeUpIcon style={{fontSize:20}}/>}
             <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => adjustVolume(e.target.value)} style={{width:80}} />
           </div>
        </div>
      </div>

      {contextMenu.visible && (
        <div className="context-menu" style={{top: contextMenu.y, left: contextMenu.x}}>
          {playlists.map(pl => (
            <div key={pl._id} className="menu-item" onClick={() => addToPlaylist(pl._id)}>
              Add to {pl.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

//