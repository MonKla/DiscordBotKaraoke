import { motion } from 'framer-motion';
import { useRoom } from '../context/RoomContext';
import './QueueList.css';

export default function QueueList({ queue, currentSong }) {
  const { removeFromQueue, skipSong } = useRoom();

  const handleRemove = async (songId) => {
    try {
      await removeFromQueue(songId);
    } catch (error) {
      console.error('Failed to remove song:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await skipSong();
    } catch (error) {
      console.error('Failed to skip song:', error);
    }
  };

  return (
    <div className="queue-list-container">
      {currentSong && (
        <div className="current-song-section">
          <span className="section-title">🎵 กำลังเล่น</span>
          <div className="current-song-card">
            <div className="song-info">
              <span className="song-title">{currentSong.title}</span>
              <span className="song-artist">{currentSong.artist}</span>
            </div>
            <button className="skip-btn" onClick={handleSkip}>
              ⏭️ ข้าม
            </button>
          </div>
        </div>
      )}

      <div className="queue-section">
        <span className="section-title">📋 เพลงถัดไป ({queue.length})</span>
        
        {queue.length === 0 ? (
          <div className="queue-empty">
            <p>ยังไม่มีเพลงในคิว</p>
            <p className="hint">ไปที่แท็บ "ค้นหา" เพื่อเพิ่มเพลง</p>
          </div>
        ) : (
          <div className="queue-items">
            {queue.map((song, index) => (
              <motion.div
                key={song.id}
                className="queue-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.03 }}
              >
                <span className="queue-number">{index + 1}</span>
                <div className="song-info">
                  <span className="song-title">{song.title}</span>
                  <span className="song-artist">{song.artist}</span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemove(song.id)}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
