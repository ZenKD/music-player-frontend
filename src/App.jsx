import { useState, useEffect, useRef } from 'react';
import { useAudioPlayer } from './useAudio';
import * as jsmediatags from 'jsmediatags';
import './App.css';

// ICONS
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
import CloseIcon from '@mui/icons-material/Close';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';

const API_URL = 'https://my-music-api-p380.onrender.com'; 

// HELPER: Latin Script Detector
// Returns true if the text is mostly A-Z characters (English/Romanized)
// Returns false if it detects other scripts (Hindi, Gurmukhi, Japanese, etc.)
const isReadable = (text) => {
  if (!text) return false;
  
  // 1. Count Latin characters (a-z, A-Z)
  const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
  
  // 2. Count total characters (excluding spaces/numbers)
  const totalCount = text.replace(/[^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/g, "").length; // Includes accents

  // Safety check to avoid divide by zero
  if (totalCount === 0) return false;

  // 3. If > 50% of the meaningful characters are Latin, it's readable
  return (latinCount / text.length) > 0.3; 
};


// --- HELPER: PARSE LRC LYRICS ---
const parseLRC = (lrcText) => {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  // Regex to catch [00:12.34] or [00:12.345]
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  const data = [];

  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = parseFloat("0." + match[3]);
      const time = min * 60 + sec + ms;
      const text = match[4].trim();
      // Only add lines that actually have text
      if (text) data.push({ time, text });
    }
  });
  return data;
};


const handleFolderUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  setIsUploading(true);
  const formData = new FormData();

  // Use the folder name as the playlist name (webkitRelativePath gives "FolderName/Song.mp3")
  const folderName = files[0].webkitRelativePath.split('/')[0];
  formData.append('playlistName', folderName);

  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  try {
    const res = await fetch(`${API_URL}/upload-playlist`, {
      method: 'POST',
      body: formData, // Auto-sets Content-Type to multipart/form-data
    });
    const data = await res.json();
    alert(data.message);
    loadData(); // Refresh UI
  } catch (error) {
    console.error(error);
    alert("Upload failed.");
  } finally {
    setIsUploading(false);
  }
};


function App() {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [currentCover, setCurrentCover] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, songId: null });
  const [isUploading, setIsUploading] = useState(false);

  // UI STATES
  const [rightPanel, setRightPanel] = useState(null); // 'lyrics', 'queue', or null
  const [syncedLyrics, setSyncedLyrics] = useState([]);
  const [plainLyrics, setPlainLyrics] = useState(""); 
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

  const { 
    currentSong, queue, isPlaying, progress, duration, volume, loopMode, isShuffle,
    playTrack, togglePlay, nextTrack, prevTrack, adjustVolume, seek, toggleShuffle, toggleLoop, audioRef
  } = useAudioPlayer();

  // Load Data
  const loadData = () => {
    fetch(`${API_URL}/songs`).then(res => res.json()).then(setSongs);
    fetch(`${API_URL}/playlists`).then(res => res.json()).then(setPlaylists);
  };
  useEffect(() => { loadData(); }, []);

// --- NEW "READABLE SCRIPT" LYRICS ENGINE ---
  useEffect(() => {
    if (!currentSong) return;
    
    setSyncedLyrics([]);
    setPlainLyrics("Searching...");
    setActiveLyricIndex(-1);

    // Clean title for better search results
    const cleanTitle = currentSong.title.replace(/\(.*\)/g, "").trim();
    const query = `${cleanTitle} ${currentSong.artist}`;

    fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // STRATEGY: Find the best version that we can actually read (Latin script)
          
          // 1. Priority: Readable + Synced
          let bestMatch = data.find(item => item.syncedLyrics && isReadable(item.syncedLyrics));

          // 2. Secondary: Readable + Plain Text
          if (!bestMatch) {
             bestMatch = data.find(item => item.plainLyrics && isReadable(item.plainLyrics));
          }

          // 3. Fallback: If absolutely no readable versions exist, use the first result
          if (!bestMatch) {
             bestMatch = data[0];
          }

          // --- RENDER ---
          if (bestMatch.syncedLyrics && isReadable(bestMatch.syncedLyrics)) {
            setSyncedLyrics(parseLRC(bestMatch.syncedLyrics));
            setPlainLyrics("");
          } else if (bestMatch.plainLyrics) {
            setSyncedLyrics([]);
            setPlainLyrics(bestMatch.plainLyrics);
          } else {
            setSyncedLyrics([]);
            setPlainLyrics("Lyrics format not supported.");
          }
        } else {
          setPlainLyrics("Lyrics not found.");
        }
      })
      .catch(err => {
        console.error(err);
        setPlainLyrics("Network error loading lyrics.");
      });
  }, [currentSong]);

  // --- SYNC LOGIC (The "PyVidrome" Logic) ---
  useEffect(() => {
    if (syncedLyrics.length === 0) return;

    // Find the last lyric line that has passed
    let idx = -1;
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (syncedLyrics[i].time <= progress) {
        idx = i;
      } else {
        break;
      }
    }

    if (idx !== activeLyricIndex) {
      setActiveLyricIndex(idx);
      // Auto-scroll logic
      const element = document.getElementById(`lyric-${idx}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [progress, syncedLyrics]);

  // Extract Art
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

  // Context Menu & Playlist Logic
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

  const toggleRightPanel = (panelName) => {
    if (rightPanel === panelName) setRightPanel(null); // Close if already open
    else setRightPanel(panelName);
  };

  // Logic to seek audio when clicking a lyric line
  const handleLyricClick = (time) => {
    if(time >= 0 && audioRef.current) {
        audioRef.current.currentTime = time;
        seek(time);
    }
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
      {/* SIDEBAR (Left) */}
      <div className="sidebar">
        <div className="logo">🎵 Music</div>
        <div className="nav-links">
          <button onClick={() => { setActivePlaylist(null); setRightPanel(null); }}>
            <HomeIcon style={{fontSize: 20, verticalAlign:'middle', marginRight: 10}}/> Home
          </button>
          <button onClick={handleSync}>
            <SyncIcon style={{fontSize: 20, verticalAlign:'middle', marginRight: 10}}/> Sync
          </button>
          {/* HIDDEN INPUT FOR FOLDER SELECTION */}
          <input
            type="file"
            id="folderInput"
            webkitdirectory="true"
            directory="true"
            multiple
            style={{ display: 'none' }}
            onChange={handleFolderUpload}
          />

          <button onClick={() => document.getElementById('folderInput').click()} disabled={isUploading}>
            <DriveFolderUploadIcon style={{fontSize: 20, verticalAlign:'middle', marginRight: 10}}/> 
            {isUploading ? "Uploading..." : "Upload Folder"}
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

      {/* MAIN CONTENT (Center) */}
      <div className="main-view">
        <div className="main-header">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        <div className="playlist-banner">
          <div className="banner-art">{activePlaylist ? '📂' : '❤️'}</div>
          <div>
            <p>PLAYLIST</p>
            <h1>{activePlaylist ? activePlaylist.name : "ALL SONGS"}</h1>
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
      </div>

      {/* RIGHT SIDEBAR (Lyrics / Queue) - Overlays on right side */}
      <div className={`right-panel ${rightPanel ? 'open' : ''}`}>
        <div className="panel-header">
           <h2>{rightPanel === 'lyrics' ? 'Lyrics' : 'Queue'}</h2>
           <CloseIcon onClick={() => setRightPanel(null)} style={{cursor:'pointer'}}/>
        </div>

        {rightPanel === 'lyrics' && (
           <div className="panel-content lyrics-container">
               {/* Cover Art in Lyrics View */}
               <img src={currentCover} style={{width:150, height:150, borderRadius:8, marginBottom: 20}}/>
               
               {/* Synced Lyrics Logic */}
               {syncedLyrics.length > 0 ? (
                   syncedLyrics.map((line, i) => (
                       <p 
                         key={i} 
                         id={`lyric-${i}`}
                         className={`lyric-line ${i === activeLyricIndex ? 'active' : ''}`}
                         onClick={() => handleLyricClick(line.time)}
                       >
                         {line.text}
                       </p>
                   ))
               ) : (
                   /* Plain Text Fallback */
                   <p className="plain-lyrics">{plainLyrics}</p>
               )}
           </div>
        )}

        {rightPanel === 'queue' && (
            <div className="panel-content queue-container">
               <h3>Now Playing</h3>
               {currentSong && (
                   <div className="queue-item active-song">
                      <div className="q-title">{currentSong.title}</div>
                      <div className="q-artist">{currentSong.artist}</div>
                   </div>
               )}
               <h3>Next Up</h3>
               {queue.map((s, i) => (
                   <div key={i} className="queue-item" onClick={() => playTrack(s)}>
                       <span style={{color:'#888', width:20}}>{i+1}</span>
                       <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          <span style={{color:'white'}}>{s.title}</span> • <span style={{color:'#888', fontSize:12}}>{s.artist}</span>
                       </div>
                   </div>
               ))}
            </div>
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
              <button onClick={toggleShuffle} style={{color: isShuffle ? '#1db954' : '#b3b3b3'}}>
                {isShuffle ? <ShuffleOnIcon/> : <ShuffleIcon/>}
              </button>
              <button onClick={prevTrack}><SkipPreviousIcon style={{fontSize: 28}}/></button>
              <button className="play-circle" onClick={togglePlay} style={{background:'none', color:'#fff'}}>
                {isPlaying ? <PauseCircleIcon style={{fontSize: 40}}/> : <PlayCircleIcon style={{fontSize: 40}}/>}
              </button>
              <button onClick={nextTrack}><SkipNextIcon style={{fontSize: 28}}/></button>
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
           <button onClick={() => toggleRightPanel('lyrics')} style={{color: rightPanel === 'lyrics' ? '#1db954' : '#b3b3b3'}}>
             <LyricsIcon/>
           </button>
           <button onClick={() => toggleRightPanel('queue')} style={{color: rightPanel === 'queue' ? '#1db954' : '#b3b3b3'}}>
             <QueueMusicIcon/>
           </button>
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

// ---