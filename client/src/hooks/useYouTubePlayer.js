import { useEffect, useRef, useState, useCallback } from 'react';

export function useYouTubePlayer(containerId, onStateChange) {
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);

  // Use a ref for the callback to avoid re-triggering effects when it changes
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsReady(true);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => {
      setIsReady(true);
    };
    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  const stopTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 100);
  }, []);

  const initPlayer = useCallback((videoId) => {
    if (!isReady || !window.YT || !document.getElementById(containerId)) return;
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
        origin: window.location.origin
      },
      events: {
        onReady: (event) => {
          setDuration(event.target.getDuration());
          startTimeTracking();
        },
        onStateChange: (event) => {
          onStateChangeRef.current?.(event.data);
          if (event.data === window.YT.PlayerState.PLAYING) {
            startTimeTracking();
          } else {
            stopTimeTracking();
          }
        }
      }
    });
  }, [isReady, containerId, startTimeTracking, stopTimeTracking]);

  const loadVideo = useCallback((videoId) => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
    } else {
      initPlayer(videoId);
    }
  }, [initPlayer]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const seekTo = useCallback((seconds) => playerRef.current?.seekTo(seconds, true), []);
  const setVolume = useCallback((volume) => playerRef.current?.setVolume(volume), []);

  useEffect(() => {
    return () => {
      stopTimeTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [stopTimeTracking]);

  return { isReady, currentTime, duration, initPlayer, loadVideo, play, pause, seekTo, setVolume };
}

export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};
