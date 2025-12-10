import { useState, useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // 0 = Off, 1 = Loop One, 2 = Loop All
  const [loopMode, setLoopMode] = useState(0); 
  const [isShuffle, setIsShuffle] = useState(false);
  
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const updateProgress = () => setProgress(audio.currentTime);
    const setAudioDuration = () => setDuration(audio.duration);
    
    // AUTO-NEXT LOGIC
    const handleEnd = () => {
      if (loopMode === 1) {
        // Loop One: Just replay
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', setAudioDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, [volume, currentIndex, queue, isShuffle, loopMode]);

  const playTrack = (song, newQueue) => {
    if (newQueue) setQueue(newQueue);
    const q = newQueue || queue;
    const index = q.findIndex(s => s._id === song._id);
    
    setCurrentIndex(index);
    setCurrentSong(song);
    audioRef.current.src = song.songUrl;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex + 1;

    // SHUFFLE LOGIC: Pick random index
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } 
    // LOOP ALL LOGIC: Wrap to 0
    else if (nextIndex >= queue.length) {
      if (loopMode === 2) nextIndex = 0;
      else return; // Stop if loop is off and we are at end
    }

    playTrack(queue[nextIndex]);
  };

  const prevTrack = () => {
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    }
  };

  const adjustVolume = (val) => {
    setVolume(val);
    audioRef.current.volume = val;
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const toggleLoop = () => {
    // Cycle: 0 -> 1 -> 2 -> 0
    setLoopMode((prev) => (prev + 1) % 3);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);

  return {
    audioRef,
    currentSong,
    queue,            // <--- EXPOSED QUEUE
    isPlaying,
    progress,
    duration,
    volume,
    loopMode,         // <--- EXPOSED LOOP
    isShuffle,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    adjustVolume,
    seek,
    toggleShuffle,
    toggleLoop
  };
};