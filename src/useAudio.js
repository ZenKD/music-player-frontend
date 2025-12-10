import { useState, useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(1); // 1 = 100%
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize Volume & Events
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const updateProgress = () => setProgress(audio.currentTime);
    const setAudioDuration = () => setDuration(audio.duration);
    const handleEnd = () => nextTrack();

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', setAudioDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, [volume, currentIndex, queue, isShuffle]); // Re-bind if queue changes

  const playTrack = (song, newQueue) => {
    // If we are clicking a new song, update queue
    if (newQueue) setQueue(newQueue);
    
    // Find index in (possibly new) queue
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
    
    // Loop back to start if at end
    if (nextIndex >= queue.length) nextIndex = 0;

    if (isShuffle) nextIndex = Math.floor(Math.random() * queue.length);
    
    playTrack(queue[nextIndex]);
  };

  const prevTrack = () => {
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else {
      // If at start, restart song
      audioRef.current.currentTime = 0;
    }
  };

  const adjustVolume = (val) => {
    const newVol = parseFloat(val);
    setVolume(newVol);
    audioRef.current.volume = newVol;
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  return {
    audioRef,
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    adjustVolume,
    seek,
    toggleShuffle,
    isShuffle
  };
};

export const toggleShuffle = () => {
  setIsShuffle(!isShuffle);
};

//