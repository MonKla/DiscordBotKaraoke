import { motion } from 'framer-motion';
import './Avatar.css';

export default function Avatar({ member, character, isSpeaking, index, side }) {
  const colors = character || {
    primaryColor: '#6B7280',
    secondaryColor: '#9CA3AF',
    name: member?.displayName || 'User'
  };

  return (
    <motion.div 
      className={`avatar-container ${side} ${isSpeaking ? 'speaking' : ''}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Music Note Animation */}
      {isSpeaking && (
        <motion.div 
          className="music-notes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span 
            className="note"
            animate={{ y: [-10, -30], opacity: [1, 0], x: [-5, -15] }}
            transition={{ duration: 1, repeat: Infinity }}
          >♪</motion.span>
          <motion.span 
            className="note"
            animate={{ y: [-10, -35], opacity: [1, 0], x: [5, 20] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          >♫</motion.span>
        </motion.div>
      )}

      {/* Avatar Body */}
      <motion.div 
        className="avatar-body"
        style={{ 
          background: `linear-gradient(180deg, ${colors.primaryColor} 0%, ${colors.secondaryColor} 100%)` 
        }}
        animate={isSpeaking ? { 
          scale: [1, 1.1, 1],
          y: [0, -8, 0]
        } : {}}
        transition={{ 
          duration: 0.3, 
          repeat: isSpeaking ? Infinity : 0 
        }}
      >
        {/* Face */}
        <div className="avatar-face">
          <div className="eyes">
            <motion.div 
              className="eye left"
              animate={isSpeaking ? { scaleY: [1, 0.2, 1] } : {}}
              transition={{ duration: 0.2, repeat: isSpeaking ? Infinity : 0, repeatDelay: 0.5 }}
            />
            <motion.div 
              className="eye right"
              animate={isSpeaking ? { scaleY: [1, 0.2, 1] } : {}}
              transition={{ duration: 0.2, repeat: isSpeaking ? Infinity : 0, repeatDelay: 0.5 }}
            />
          </div>
          <motion.div 
            className="mouth"
            animate={isSpeaking ? { 
              scaleY: [0.5, 1.2, 0.8, 1, 0.5],
              scaleX: [1, 1.1, 0.9, 1, 1]
            } : { scaleY: 0.3 }}
            transition={{ 
              duration: 0.15, 
              repeat: isSpeaking ? Infinity : 0 
            }}
          />
        </div>
      </motion.div>

      {/* Name Tag */}
      <div className="avatar-name">
        {member?.displayName || colors.name}
      </div>
    </motion.div>
  );
}
