import { motion } from 'framer-motion';
import './QueuePanel.css';

export default function QueuePanel({ queue, currentSong, onClose }) {
  return (
    <motion.div 
      className="queue-panel-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="queue-panel glass"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="queue-header">
          <h3>📋 คิวเพลง</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="queue-content">
          {currentSong && (
            <div className="now-playing-section">
              <span className="section-label">กำลังเล่น</span>
              <div className="queue-item current">
                <div className="queue-item-info">
                  <span className="item-title">{currentSong.title}</span>
                  <span className="item-artist">{currentSong.artist}</span>
                </div>
                <span className="playing-indicator">🎵</span>
              </div>
            </div>
          )}

          <div className="upcoming-section">
            <span className="section-label">เพลงถัดไป ({queue.length})</span>
            {queue.length === 0 ? (
              <div className="queue-empty">
                <p>ยังไม่มีเพลงในคิว</p>
                <p className="hint">ใช้มือถือเพื่อเพิ่มเพลง</p>
              </div>
            ) : (
              <div className="queue-list">
                {queue.map((song, index) => (
                  <motion.div 
                    key={song.id}
                    className="queue-item"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="item-number">{index + 1}</span>
                    <div className="queue-item-info">
                      <span className="item-title">{song.title}</span>
                      <span className="item-artist">{song.artist}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
