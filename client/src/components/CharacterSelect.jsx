import { motion } from 'framer-motion';
import { useRoom } from '../context/RoomContext';
import './CharacterSelect.css';

export default function CharacterSelect({ characters, members, selectedCharacter, onSelect, onClose }) {
  const { selectCharacter } = useRoom();

  const handleSelect = async (character) => {
    try {
      // For demo, we'll just select locally
      // In production, you'd also call selectCharacter with user ID
      onSelect(character);
    } catch (error) {
      console.error('Failed to select character:', error);
    }
  };

  return (
    <motion.div 
      className="character-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="character-modal glass"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>🎭 เลือกตัวละคร</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="character-grid">
          {characters.map((char) => {
            const isSelected = selectedCharacter?.id === char.id;
            const isTaken = char.assignedTo && char.assignedTo !== selectedCharacter?.assignedTo;
            
            return (
              <motion.button
                key={char.id}
                className={`character-card ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                onClick={() => !isTaken && handleSelect(char)}
                disabled={isTaken}
                whileHover={!isTaken ? { scale: 1.05 } : {}}
                whileTap={!isTaken ? { scale: 0.95 } : {}}
              >
                <div 
                  className="character-avatar"
                  style={{ 
                    background: `linear-gradient(180deg, ${char.primaryColor} 0%, ${char.secondaryColor} 100%)` 
                  }}
                >
                  <div className="avatar-face-mini">
                    <div className="eyes-mini">
                      <div className="eye-mini" />
                      <div className="eye-mini" />
                    </div>
                    <div className="mouth-mini" />
                  </div>
                </div>
                <span className="character-name">{char.name}</span>
                {isTaken && <span className="taken-label">ถูกเลือกแล้ว</span>}
                {isSelected && <span className="selected-check">✓</span>}
              </motion.button>
            );
          })}
        </div>

        <div className="modal-footer">
          <p className="hint">ตัวละครจะแสดงบนหน้าจอหลักเมื่อคุณพูดใน Discord</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
