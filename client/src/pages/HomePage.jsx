import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useRoom } from '../context/RoomContext';
import { Icons } from '../components/Icons';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const { createRoom, joinRoom } = useRoom();
  
  const [mode, setMode] = useState(null); // 'host' | 'join'
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const room = await createRoom();
      navigate(`/host/${room.code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (asHost = false) => {
    if (roomCode.length !== 4) {
      setError('Please enter a 4-letter Room Code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await joinRoom(roomCode.toUpperCase(), asHost);
      navigate(asHost ? `/host/${roomCode.toUpperCase()}` : `/controller/${roomCode.toUpperCase()}`);
    } catch (err) {
      setError(err.message || 'Room not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Dynamic Background */}
      <div className="bg-orbs">
        <motion.div className="orb orb-1" animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
        <motion.div className="orb orb-2" animate={{ x: [0, -80, 0], y: [0, 80, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
      </div>

      <div className="home-content container">
        
        {/* Help Button */}
        <button className="help-button" onClick={() => setShowTutorial(true)}>
          <Icons.Info width={24} height={24} />
          <span>How to Play</span>
        </button>

        {/* Header Section */}
        <motion.div 
          className="hero-section"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className="hero-icon"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icons.Mic width={80} height={80} strokeWidth={1.5} />
          </motion.div>
          <h1 className="hero-title">
            <span className="text-gradient">Karaoke</span> 
            <span className="text-white">Party</span>
          </h1>
          <p className="hero-subtitle">Sing with friends on Discord!</p>
        </motion.div>

        {/* Main Selection Cards */}
        <motion.div 
          className="card-grid"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {!mode ? (
            <>
              {/* Host Card */}
              <motion.button
                onClick={() => setMode('host')}
                className="choice-card host-card"
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="card-glow purple" />
                <div className="card-icon">
                  <Icons.Tv width={48} height={48} />
                </div>
                <h2 className="card-title">Host Party</h2>
                <p className="card-desc">Create a room for the big screen. Show lyrics & videos here!</p>
                <div className="card-cta">
                  Start Hosting <Icons.ArrowRight width={20} height={20} className="arrow" />
                </div>
              </motion.button>

              {/* Join Card */}
              <motion.button
                onClick={() => setMode('join')}
                className="choice-card join-card"
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="card-glow pink" />
                <div className="card-icon">
                  <Icons.Phone width={48} height={48} />
                </div>
                <h2 className="card-title">Join Party</h2>
                <p className="card-desc">Use your phone to pick songs, control playback, and add to queue.</p>
                <div className="card-cta">
                  Join Room <Icons.ArrowRight width={20} height={20} className="arrow" />
                </div>
              </motion.button>
            </>
          ) : (
            // Form Container
            <motion.div 
              className="form-container glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button 
                onClick={() => { setMode(null); setError(''); }}
                className="back-button"
              >
                <Icons.ArrowLeft width={20} height={20} /> Back
              </button>

              <div className="form-content">
                <div className="form-icon">
                  {mode === 'host' ? <Icons.Tv width={64} height={64} /> : <Icons.Phone width={64} height={64} />}
                </div>
                <h2 className="form-title">
                  {mode === 'host' ? 'Setup Big Screen' : 'Join from Mobile'}
                </h2>
                <p className="form-subtitle">
                  {mode === 'host' 
                    ? 'Start a new session or reconnect to an existing one.' 
                    : 'Enter the 4-letter code shown on the TV screen.'}
                </p>

                {mode === 'host' ? (
                  <div className="form-group">
                    <button
                      onClick={handleCreateRoom}
                      disabled={loading || !isConnected}
                      className="btn btn-primary btn-xl w-full"
                    >
                      {loading ? 'Creating...' : '✨ Create New Room'}
                    </button>
                    
                    <div className="divider-text">
                      <span>OR RECONNECT</span>
                    </div>

                    <div className="input-row">
                      <input
                        type="text"
                        placeholder="CODE"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                        className="input input-code"
                      />
                      <button
                        onClick={() => handleJoinRoom(true)}
                        disabled={loading || roomCode.length !== 4}
                        className="btn btn-secondary"
                      >
                        Go <Icons.ArrowRight width={16} height={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <div className="code-input-wrapper">
                      <label>ROOM CODE</label>
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                        placeholder="XXXX"
                        className="input-giant"
                        autoFocus
                      />
                    </div>
                    
                    <button
                      onClick={() => handleJoinRoom(false)}
                      disabled={loading || roomCode.length !== 4}
                      className="btn btn-primary btn-xl w-full"
                    >
                      {loading ? 'Joining...' : '🚀 Join Party!'}
                    </button>
                  </div>
                )}

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="error-banner"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div 
              className="tutorial-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="tutorial-card glass"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="tutorial-header">
                  <h2><Icons.Info width={24} height={24} /> How to Use</h2>
                  <button className="close-btn" onClick={() => setShowTutorial(false)}>
                    <Icons.X width={24} height={24} />
                  </button>
                </div>
                <div className="tutorial-steps">
                  <div className="step">
                    <div className="step-icon"><Icons.Tv width={32} height={32} /></div>
                    <div className="step-text">
                      <h3>1. Start on PC</h3>
                      <p>Open this website on your PC/TV. Click "Host Party" and create a room.</p>
                    </div>
                  </div>
                  <div className="step-line" />
                  <div className="step">
                    <div className="step-icon"><Icons.Phone width={32} height={32} /></div>
                    <div className="step-text">
                      <h3>2. Join with Phones</h3>
                      <p>Friends scan a QR code or go to <code>{window.location.host}</code> on their phones and enter the Room Code.</p>
                    </div>
                  </div>
                  <div className="step-line" />
                  <div className="step">
                    <div className="step-icon"><Icons.Mic width={32} height={32} /></div>
                    <div className="step-text">
                      <h3>3. Sing Together!</h3>
                      <p>Pick songs from your phone. Lyrics show up on the big screen.</p>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary w-full mt-lg" onClick={() => setShowTutorial(false)}>
                  Got it!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Status */}
      <div className="status-footer">
        <div className={`status-pill ${isConnected ? 'online' : 'offline'}`}>
          <span className="status-dot-pulse" />
          <span className="status-label">{isConnected ? 'System Online' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
}
