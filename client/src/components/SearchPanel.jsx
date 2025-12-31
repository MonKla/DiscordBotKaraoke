import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRoom } from '../context/RoomContext';
import { Icons } from './Icons';
import './SearchPanel.css';

export default function SearchPanel() {
  const { addToQueue } = useRoom();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    try {
      // Append keywords to find karaoke versions
      const searchQuery = `${query} karaoke instrumental`;
      
      // Use relative path to leverage Vite proxy
      const apiBase = ''; // Relative path
      const response = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = async (song) => {
    setAdding(song.videoId);
    try {
      await addToQueue({
        title: song.title,
        artist: song.artist,
        videoId: song.videoId,
        thumbnail: song.thumbnail
      });
      // Show success feedback
    } catch (error) {
      console.error('Failed to add to queue:', error);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="search-panel">
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          className="input search-input"
          placeholder="ค้นหาเพลง..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button 
          type="submit" 
          className="btn btn-primary search-btn"
          disabled={loading}
        >
          {loading ? '...' : <Icons.Search width={20} height={20} />}
        </button>
      </form>

      <div className="search-results">
        {results.length === 0 && !loading && (
          <div className="search-empty">
            <span className="empty-icon"><Icons.Music width={48} height={48} /></span>
            <p>ค้นหาเพลงที่คุณอยากร้อง</p>
            <p className="hint">ระบบจะเพิ่มคำว่า "Karaoke" อัตโนมัติ</p>
          </div>
        )}

        {results.map((song, index) => (
          <motion.div
            key={`${song.videoId}-${index}`}
            className="search-result-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <img 
              src={song.thumbnail} 
              alt={song.title}
              className="result-thumbnail"
            />
            <div className="result-info">
              <span className="result-title">{song.title}</span>
              <span className="result-artist">{song.artist}</span>
            </div>
            <button
              className="add-btn"
              onClick={() => handleAddToQueue(song)}
              disabled={adding === song.videoId}
            >
              {adding === song.videoId ? '⏳' : <Icons.Plus width={20} height={20} />}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
