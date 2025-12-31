import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useRoom } from '../context/RoomContext';
import Avatar from '../components/Avatar';
import LyricsDisplay from '../components/LyricsDisplay';
import QueuePanel from '../components/QueuePanel';
import YouTubePlayer from '../components/YouTubePlayer';
import { PlayerState } from '../hooks/useYouTubePlayer';
import { Icons } from '../components/Icons';
import './HostPage.css';

export default function HostPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { 
    room, 
    members, 
    characters, 
    queue,
    currentSong,
    playerState,
    speakingUsers,
    joinRoom, 
    setupListeners,
    skipSong
  } = useRoom();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQueue, setShowQueue] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef(null);

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

  // Sync player state to server
  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
    // Emit to server for sync (throttled)
    if (socket && Math.floor(time) !== Math.floor(currentTime)) {
      socket.emit('player:state', { currentTime: time, isPlaying: true });
    }
  }, [socket, currentTime]);

  const handlePlayerStateChange = useCallback((state) => {
    if (socket) {
      socket.emit('player:state', { 
        isPlaying: state === PlayerState.PLAYING,
        currentTime 
      });
    }
  }, [socket, currentTime]);

  const handleVideoEnded = useCallback(() => {
    // Auto-skip to next song
    skipSong();
  }, [skipSong]);

  // Get character for each member
  const getMemberCharacter = (userId) => {
    return characters.find(c => c.assignedTo === userId);
  };

  if (loading) {
    return (
      <div className="host-page loading">
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Icons.Mic width={48} height={48} />
        </motion.div>
        <p>กำลังเข้าห้อง...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="host-page error">
        <div className="error-card glass">
          <span className="error-icon"><Icons.X width={32} height={32} /></span>
          <h2>เกิดข้อผิดพลาด</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="host-page">
      {/* Room Code Display Badge (Top Right) */}
      <motion.div 
        className="room-code-corner"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="code-capsule">
          <span className="code-label">ROOM CODE</span>
          <span className="code-value">{roomCode}</span>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="host-main">
        {/* Left Side - Avatars */}
        <div className="avatars-left">
          {members.slice(0, Math.ceil(members.length / 2)).map((member, index) => (
            <Avatar
              key={member.userId}
              member={member}
              character={getMemberCharacter(member.userId)}
              isSpeaking={speakingUsers[member.userId]}
              index={index}
              side="left"
            />
          ))}
        </div>

        {/* Center - Video & Lyrics */}
        <div className="center-content">
          {/* YouTube Player Area */}
          <div className="video-container glass">
            {currentSong && currentSong.videoId ? (
              <YouTubePlayer
                ref={playerRef}
                videoId={currentSong.videoId}
                onTimeUpdate={handleTimeUpdate}
                onStateChange={handlePlayerStateChange}
                onEnded={handleVideoEnded}
              />
            ) : (
              <div className="no-song">
                <motion.span 
                  className="no-song-icon"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icons.Music width={80} height={80} strokeWidth={1.5} />
                </motion.span>
                <h2>รอเพลงแรก</h2>
                <p>ใช้มือถือเพื่อค้นหาและเพิ่มเพลง</p>
              </div>
            )}
          </div>

          {/* Lyrics Display */}
          <LyricsDisplay 
            song={currentSong}
            currentTime={currentTime}
            offset={playerState.lyricsOffset || 0}
          />
        </div>

        {/* Right Side - Avatars */}
        <div className="avatars-right">
          {members.slice(Math.ceil(members.length / 2)).map((member, index) => (
            <Avatar
              key={member.userId}
              member={member}
              character={getMemberCharacter(member.userId)}
              isSpeaking={speakingUsers[member.userId]}
              index={index}
              side="right"
            />
          ))}
        </div>
      </div>

      {/* Queue Toggle Button */}
      <motion.button
        className="queue-toggle-btn glass"
        onClick={() => setShowQueue(!showQueue)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="btn-icon"><Icons.List width={20} height={20} /></span>
        <span className="btn-text">คิวเพลง</span>
        {queue.length > 0 && (
          <span className="queue-count">{queue.length}</span>
        )}
      </motion.button>

      {/* Queue Panel */}
      <AnimatePresence>
        {showQueue && (
          <QueuePanel 
            queue={queue} 
            currentSong={currentSong}
            onClose={() => setShowQueue(false)} 
          />
        )}
      </AnimatePresence>

      {/* Waiting for Bot Connection */}
      {members.length === 0 && (
        <motion.div 
          className="waiting-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="waiting-card glass">
            <motion.span 
              className="waiting-icon"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Icons.Mic width={64} height={64} />
            </motion.span>
            <h3>รอการเชื่อมต่อ Discord Bot</h3>
            <p>พิมพ์คำสั่งใน Discord:</p>
            <code>!karaoke join {roomCode}</code>
            <p className="hint">หรือ <code>!karaoke create</code> เพื่อสร้างห้องใหม่</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
