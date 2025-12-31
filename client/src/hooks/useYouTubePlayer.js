import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for YouTube IFrame Player API
 */
export function useYouTubePlayer(containerId, onStateChange) {
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsReady(true);
      return;
    }

    // Create script tag
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Set callback
    window.onYouTubeIframeAPIReady = () => {
      setIsReady(true);
    };

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  // Initialize player when API is ready
  const initPlayer = useCallback((videoId) => {
    if (!isReady || !window.YT) return;

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(containerId, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
        cc_load_policy: 0,
        iv_load_policy: 3,
        origin: window.location.origin
      },
      events: {
        onReady: (event) => {
          setDuration(event.target.getDuration());
          // Start time tracking
          startTimeTracking();
        },
        onStateChange: (event) => {
          onStateChange?.(event.data);
          
          // Handle play/pause for time tracking
          if (event.data === window.YT.PlayerState.PLAYING) {
            startTimeTracking();
          } else {
            stopTimeTracking();
          }
        },
        onError: (event) => {
          console.error('YouTube Player Error:', event.data);
        }
      }
    });
  }, [isReady, containerId, onStateChange]);

  // Time tracking
  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 100); // Update every 100ms for smooth lyrics sync
  }, []);

  const stopTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Player controls
  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback((seconds) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const setVolume = useCallback((volume) => {
    playerRef.current?.setVolume(volume);
  }, []);

  // Load new video
  const loadVideo = useCallback((videoId) => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
    } else {
      initPlayer(videoId);
    }
  }, [initPlayer]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopTimeTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [stopTimeTracking]);

  return {
    isReady,
    currentTime,
    duration,
    initPlayer,
    loadVideo,
    play,
    pause,
    seekTo,
    setVolume
  };
}

// YouTube Player State constants
export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};
