import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useRoom } from '../context/RoomContext';
import Avatar from '../components/Avatar';
import LyricsDisplay from '../components/LyricsDisplay';
import QueuePanel from '../components/QueuePanel';
import YouTubePlayer from '../components/YouTubePlayer';
import SearchPanel from '../components/SearchPanel';
import { PlayerState } from '../hooks/useYouTubePlayer';
import { Icons } from '../components/Icons';
import './HostPage.css';

export default function HostPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { 
    members, 
    characters, 
    queue,
    currentSong,
    playerState,
    speakingUsers,
    joinRoom, 
    setupListeners,
    skipSong,
    playPrevious
  } = useRoom();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQueue, setShowQueue] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef(null);
  const lastSyncTimeRef = useRef(0); // Track last broadcasted time

  useEffect(() => {
    if (!isConnected) return;
    const initRoom = async () => {
      try {
        await joinRoom(roomCode, true);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'ไม่สามารถเข้าร่วมห้องได้');
        setLoading(false);
      }
    };
    initRoom();
  }, [isConnected, roomCode, joinRoom]);

  useEffect(() => {
    const cleanup = setupListeners();
    return cleanup;
  }, [setupListeners]);

  useEffect(() => {
    if (socket) {
      socket.on('voice:speaking', (data) => {
        console.log('🎤 Voice Speaking Event:', data);
      });
      return () => socket.off('voice:speaking');
    }
  }, [socket]);

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
    
    // Periodically sync to server to keep other clients in loop
    // Only if we've moved significantly (e.g. 1s) and it's a new second
    if (socket && Math.abs(time - lastSyncTimeRef.current) >= 1) {
      lastSyncTimeRef.current = time;
      socket.emit('player:state', { 
        currentTime: time, 
        isPlaying: true 
      });
    }
  }, [socket]);

  const handlePlayerStateChange = useCallback((state) => {
    if (socket) {
      socket.emit('player:state', { 
        isPlaying: state === PlayerState.PLAYING,
        currentTime 
      });
    }
  }, [socket, currentTime]);

  const handleVideoEnded = useCallback(() => {
    skipSong();
  }, [skipSong]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) setShowQueue(false);
  };

  const toggleQueue = () => {
    setShowQueue(!showQueue);
    if (!showQueue) setShowSearch(false);
  };

  const getMemberCharacter = (userId) => characters.find(c => c.assignedTo === userId);

  if (loading) return (
    <div className="host-page loading">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Icons.Mic width={48} height={48} />
      </motion.div>
      <p>กำลังเข้าห้อง...</p>
    </div>
  );

  if (error) return (
    <div className="host-page error">
      <div className="error-card glass">
        <h2>เกิดข้อผิดพลาด</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
      </div>
    </div>
  );

  return (
    <div className="host-page">
      <header className="host-header">
        <div className="code-capsule">
          <span className="code-label">ROOM CODE</span>
          <span className="code-value">{roomCode}</span>
        </div>
      </header>

      <main className="host-main">
        <div className="video-wrapper">
          {currentSong?.videoId ? (
            <YouTubePlayer
              ref={playerRef}
              videoId={currentSong.videoId}
              onTimeUpdate={handleTimeUpdate}
              onStateChange={handlePlayerStateChange}
              onEnded={handleVideoEnded}
            />
          ) : (
            <div className="no-song">
              <Icons.Music width={80} height={80} strokeWidth={1} />
              <h2>พร้อมสร้างตำนานหรือยัง?</h2>
              <p>ค้นหาเพลงเพื่อเริ่มปาร์ตี้</p>
            </div>
          )}
        </div>

        <div className="lyrics-wrapper">
          <LyricsDisplay 
            song={currentSong}
            currentTime={currentTime}
            offset={playerState.lyricsOffset || 0}
          />
        </div>

        <div className="controls-bar">
          <motion.button className="control-btn" onClick={playPrevious} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Previous Song">
            <Icons.ArrowLeft width={20} height={20} />
          </motion.button>

          <motion.button className="control-btn" onClick={toggleSearch} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Icons.Search width={20} height={20} />
            <span>ค้นหาเพลง</span>
          </motion.button>

          <motion.button className="control-btn" onClick={toggleQueue} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Icons.List width={20} height={20} />
            <span>คิวเพลง</span>
            {queue.length > 0 && <span className="queue-count">{queue.length}</span>}
          </motion.button>

          <motion.button className="control-btn" onClick={skipSong} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Skip Song">
            <Icons.ArrowRight width={20} height={20} />
          </motion.button>
        </div>
      </main>

      <footer className="avatars-footer">
        {members.map((member, index) => (
          <Avatar
            key={member.userId}
            member={member}
            character={getMemberCharacter(member.userId)}
            isSpeaking={speakingUsers[member.userId]}
            index={index}
            side="bottom"
          />
        ))}
      </footer>

      <AnimatePresence>
        {showQueue && (
          <QueuePanel queue={queue} currentSong={currentSong} onClose={() => setShowQueue(false)} />
        )}
        {showSearch && (
          <motion.div className="search-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSearch(false)}>
            <motion.div className="search-card" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="search-header">
                <h3>🔍 ค้นหาเพลง</h3>
                <button className="close-btn" onClick={() => setShowSearch(false)}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                <SearchPanel />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
