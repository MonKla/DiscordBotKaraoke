import { motion, AnimatePresence } from 'framer-motion';
import './Avatar.css';

export default function Avatar({ member, character, isSpeaking, index, side }) {
  return (
    <motion.div 
      className={`avatar-container ${side} ${isSpeaking ? 'is-speaking' : 'is-idle'}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isSpeaking ? 1.1 : 1,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 20 
      }}
    >
      {/* Speaking Glow Effect */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div 
            className="speaking-glow-ring"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1.4 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          />
        )}
      </AnimatePresence>

      {/* Floating Music Notes */}
      <AnimatePresence>
        {isSpeaking && (
          <div className="music-notes">
            <motion.span 
              className="note"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -60, opacity: [0, 1, 0], x: -20 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >♪</motion.span>
            <motion.span 
              className="note"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -70, opacity: [0, 1, 0], x: 20 }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
            >♫</motion.span>
          </div>
        )}
      </AnimatePresence>

      {/* Reactive Body */}
      <motion.div 
        className="avatar-body"
        style={{ 
          background: character 
            ? `linear-gradient(180deg, ${character.primaryColor} 0%, ${character.secondaryColor} 100%)`
            : `linear-gradient(180deg, #6B7280 0%, #4B5563 100%)`
        }}
        animate={isSpeaking ? { 
          y: [0, -25, 0],
          scaleY: [1, 1.15, 0.9, 1.1, 1], // Squash and stretch
          scaleX: [1, 0.85, 1.1, 0.9, 1],
          rotate: [0, -4, 4, -4, 0],
        } : { y: 0, scale: 1, rotate: 0 }}
        transition={isSpeaking ? { 
          duration: 0.45, 
          repeat: Infinity,
          ease: "easeInOut"
        } : { type: 'spring', stiffness: 500, damping: 30 }}
      >
        {member?.avatar ? (
          <div className="avatar-image-container">
            <img 
              src={member.avatar} 
              alt={member.displayName} 
              className={`avatar-image ${!isSpeaking ? 'dimmed' : ''}`} 
            />
          </div>
        ) : (
          <div className="avatar-face">
            <div className="eyes">
              <motion.div className="eye left" animate={isSpeaking ? { scaleY: [1, 0.2, 1] } : {}} />
              <motion.div className="eye right" animate={isSpeaking ? { scaleY: [1, 0.2, 1] } : {}} />
            </div>
            <motion.div 
              className="mouth"
              animate={isSpeaking ? { 
                scaleY: [0.5, 2.0, 0.5, 1.5, 0.5],
                borderRadius: ["50%", "20%", "50%"]
              } : { scaleY: 0.2 }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
          </div>
        )}
      </motion.div>

      {/* Name Tag Highlight */}
      <motion.div 
        className={`avatar-name ${isSpeaking ? 'active' : ''}`}
        animate={isSpeaking ? { scale: 1.1 } : { scale: 1 }}
      >
        <span className="name-text">{member?.displayName || "User"}</span>
      </motion.div>
    </motion.div>
  );
}
