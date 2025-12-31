import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import './LyricsDisplay.css';

export default function LyricsDisplay({ song, currentTime, offset = 0 }) {
  const [lyrics, setLyrics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch lyrics when song changes
  useEffect(() => {
    if (!song?.title || !song?.artist) {
      setLyrics([]);
      return;
    }

    const fetchLyrics = async () => {
      setLoading(true);
      try {
        // Use LRCLIB API to fetch synced lyrics
        const response = await fetch(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(song.title)}&artist_name=${encodeURIComponent(song.artist)}`
        );
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].syncedLyrics) {
          const parsed = parseLRC(data[0].syncedLyrics);
          setLyrics(parsed);
        } else {
          setLyrics([]);
        }
      } catch (error) {
        console.error('Failed to fetch lyrics:', error);
        setLyrics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [song?.title, song?.artist]);

  // Parse LRC format to array of { time, text }
  const parseLRC = (lrcText) => {
    const lines = lrcText.split('\n');
    const result = [];
    
    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = parseInt(match[3].padEnd(3, '0'));
        const time = minutes * 60 + seconds + ms / 1000;
        const text = match[4].trim();
        if (text) {
          result.push({ time, text });
        }
      }
    }
    
    return result;
  };

  // Find current lyric index
  const currentIndex = useMemo(() => {
    const adjustedTime = currentTime + offset;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (lyrics[i].time <= adjustedTime) {
        return i;
      }
    }
    return -1;
  }, [lyrics, currentTime, offset]);

  // Get visible lyrics (current, prev, next)
  const visibleLyrics = useMemo(() => {
    if (lyrics.length === 0) return [];
    
    const start = Math.max(0, currentIndex - 1);
    const end = Math.min(lyrics.length, currentIndex + 3);
    
    return lyrics.slice(start, end).map((lyric, i) => ({
      ...lyric,
      isCurrent: start + i === currentIndex,
      isPast: start + i < currentIndex
    }));
  }, [lyrics, currentIndex]);

  if (!song) {
    return null;
  }

  return (
    <div className="lyrics-display glass">
      {loading ? (
        <div className="lyrics-loading">
          <span>กำลังโหลดเนื้อเพลง...</span>
        </div>
      ) : lyrics.length === 0 ? (
        <div className="lyrics-empty">
          <span>ไม่พบเนื้อเพลง</span>
        </div>
      ) : (
        <div className="lyrics-container">
          {visibleLyrics.map((lyric, index) => (
            <motion.div
              key={`${lyric.time}-${index}`}
              className={`lyric-line ${lyric.isCurrent ? 'current' : ''} ${lyric.isPast ? 'past' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {lyric.text}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
