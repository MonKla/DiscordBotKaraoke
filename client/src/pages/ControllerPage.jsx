import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useRoom } from '../context/RoomContext';
import SearchPanel from '../components/SearchPanel';
import QueueList from '../components/QueueList';
import CharacterSelect from '../components/CharacterSelect';
import { Icons } from '../components/Icons';
import './ControllerPage.css';

export default function ControllerPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const { 
    room, members, characters, queue, currentSong, playerState,
    joinRoom, setupListeners, adjustLyricsOffset, skipSong
  } = useRoom();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);

  useEffect(() => {
    if (!isConnected) return;
    const initRoom = async () => {
      try {
        await joinRoom(roomCode, false);
        setLoading(false);
        setShowCharacterSelect(true);
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

  const handleOffsetChange = (delta) => {
    const newOffset = (playerState.lyricsOffset || 0) + delta;
    adjustLyricsOffset(newOffset);
  };

  if (loading) {
    return (
      <div className="controller-page loading">
        <motion.div className="loading-spinner" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <Icons.Phone width={24} height={24} />
        </motion.div>
        <p>กำลังเข้าห้อง...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="controller-page error">
        <div className="error-card glass">
          <span className="error-icon"><Icons.X width={32} height={32} /></span>
          <h2>เกิดข้อผิดพลาด</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
        </div>
      </div>
    );
  }

  return (
    <div className="controller-page">
      <header className="controller-header glass">
        <div className="header-left">
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            <Icons.ArrowLeft width={20} height={20} />
          </button>
          <div className="room-info">
            <span className="room-label">ห้อง</span>
            <span className="room-code">{roomCode}</span>
          </div>
        </div>
        <button className="character-btn" onClick={() => setShowCharacterSelect(true)}>
          {selectedCharacter ? 
            <span className="character-preview" style={{ background: selectedCharacter.primaryColor }} /> : 
            <Icons.User width={20} height={20} />
          }
        </button>
      </header>

      {currentSong && (
        <motion.div className="now-playing glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="now-playing-info">
            <span className="now-label">🎵 กำลังเล่น</span>
            <h3 className="song-title">{currentSong.title}</h3>
            <p className="song-artist">{currentSong.artist}</p>
          </div>
          <div className="offset-controls">
            <button className="offset-btn" onClick={() => handleOffsetChange(-0.5)}>-0.5s</button>
            <span className="offset-value">{(playerState.lyricsOffset || 0).toFixed(1)}s</span>
            <button className="offset-btn" onClick={() => handleOffsetChange(0.5)}>+0.5s</button>
          </div>
        </motion.div>
      )}

      <nav className="controller-nav">
        <button 
          className={`nav-btn ${activeTab === 'search' ? 'active search' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <span className="icon"><Icons.Search width={24} height={24} /></span>
          <span className="label">Search</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'queue' ? 'active queue' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          {queue.length > 0 && <span className="badge">{queue.length}</span>}
          <span className="icon"><Icons.List width={24} height={24} /></span>
          <span className="label">Queue</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'settings' ? 'active settings' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="icon"><Icons.Settings width={24} height={24} /></span>
          <span className="label">Settings</span>
        </button>
      </nav>

      <div className="tab-content">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SearchPanel /></motion.div>}
          {activeTab === 'queue' && <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><QueueList queue={queue} currentSong={currentSong} /></motion.div>}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="settings-panel">
              <h3>การตั้งค่า</h3>
              <button className="btn btn-secondary w-full" onClick={() => setShowCharacterSelect(true)}>เปลี่ยนตัวละคร</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCharacterSelect && <CharacterSelect characters={characters} members={members} selectedCharacter={selectedCharacter} onSelect={(char) => { setSelectedCharacter(char); setShowCharacterSelect(false); }} onClose={() => setShowCharacterSelect(false)} />}
      </AnimatePresence>
    </div>
  );
}
