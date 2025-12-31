import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useYouTubePlayer, PlayerState } from '../hooks/useYouTubePlayer';
import './YouTubePlayer.css';

const YouTubePlayer = forwardRef(({ videoId, onTimeUpdate, onStateChange, onEnded }, ref) => {
  const containerRef = useRef(null);
  
  const {
    isReady,
    currentTime,
    duration,
    initPlayer,
    loadVideo,
    play,
    pause,
    seekTo,
    setVolume
  } = useYouTubePlayer('youtube-player-container', (state) => {
    onStateChange?.(state);
    if (state === PlayerState.ENDED) {
      onEnded?.();
    }
  });

  // Expose controls to parent
  useImperativeHandle(ref, () => ({
    play,
    pause,
    seekTo,
    setVolume,
    getCurrentTime: () => currentTime
  }), [play, pause, seekTo, setVolume, currentTime]);

  // Initialize player when video ID changes
  useEffect(() => {
    if (isReady && videoId) {
      loadVideo(videoId);
    }
  }, [isReady, videoId, loadVideo]);

  // Report time updates
  useEffect(() => {
    onTimeUpdate?.(currentTime);
  }, [currentTime, onTimeUpdate]);

  return (
    <div className="youtube-player-wrapper">
      <div 
        id="youtube-player-container" 
        ref={containerRef}
        className="youtube-player-container"
      />
      
      {/* Progress bar overlay */}
      <div className="player-progress">
        <div 
          className="progress-bar"
          style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
      </div>

      {/* Time display */}
      <div className="player-time">
        <span>{formatTime(currentTime)}</span>
        <span>/</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';

// Helper function to format time
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default YouTubePlayer;
