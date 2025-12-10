import { useState, useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]); // The list of songs to play
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);

  // Play a specific song and set the queue context
  const playTrack = (song, newQueue) => {
    setQueue(newQueue);
    const index = newQueue.findIndex(s => s._id === song._id);
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
    if (currentIndex < queue.length - 1) {
      let nextIndex = currentIndex + 1;
      if (isShuffle) nextIndex = Math.floor(Math.random() * queue.length);
      
      const nextSong = queue[nextIndex];
      setCurrentIndex(nextIndex);
      setCurrentSong(nextSong);
      audioRef.current.src = nextSong.songUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const prevTrack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
      audioRef.current.src = queue[prevIndex].songUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);

  // Auto-play next song when current ends
  useEffect(() => {
    audioRef.current.onended = nextTrack;
  }, [currentIndex, queue]);

  return {
    audioRef,
    currentSong,
    isPlaying,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    isShuffle
  };
};