import { createContext, useContext, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    lyricsOffset: 0
  });
  const [speakingUsers, setSpeakingUsers] = useState({});

  // Create a new room
  const createRoom = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('room:create', (response) => {
        if (response.success) {
          setRoom(response.room);
          setCharacters(response.room.characters || []);
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, [socket]);

  // Join an existing room
  const joinRoom = useCallback((roomCode, isHost = false) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('room:join', { roomCode, isHost }, (response) => {
        if (response.success) {
          setRoom(response.room);
          setMembers(response.room.discordMembers || []);
          setCharacters(response.room.characters || []);
          setQueue(response.room.queue || []);
          setCurrentSong(response.room.currentSong);
          setPlayerState(response.room.playerState || {});
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, [socket]);

  // Leave current room
  const leaveRoom = useCallback(() => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve();
        return;
      }

      socket.emit('room:leave', () => {
        setRoom(null);
        setMembers([]);
        setCharacters([]);
        setQueue([]);
        setCurrentSong(null);
        resolve();
      });
    });
  }, [socket]);

  // Select character
  const selectCharacter = useCallback((userId, characterId) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('character:select', { userId, characterId }, (response) => {
        if (response.success) {
          resolve(true);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, [socket]);

  // Add song to queue
  const addToQueue = useCallback((songData) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('queue:add', songData, (response) => {
        if (response.success) {
          resolve(response.song);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, [socket]);

  // Remove song from queue
  const removeFromQueue = useCallback((songId) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('queue:remove', { songId }, (response) => {
        if (response.success) {
          resolve(true);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, [socket]);

  // Skip to next song
  const skipSong = useCallback(() => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve(null);
        return;
      }

      socket.emit('queue:skip', (response) => {
        resolve(response?.song || null);
      });
    });
  }, [socket]);

  // Update lyrics offset
  const adjustLyricsOffset = useCallback((offset) => {
    if (!socket) return;
    socket.emit('player:lyrics-offset', { offset });
    setPlayerState(prev => ({ ...prev, lyricsOffset: offset }));
  }, [socket]);

  // Setup socket event listeners
  const setupListeners = useCallback(() => {
    if (!socket) return;

    socket.on('room:members-updated', (updatedMembers) => {
      setMembers(updatedMembers);
    });

    socket.on('character:updated', ({ characters: updatedCharacters }) => {
      setCharacters(updatedCharacters);
    });

    socket.on('queue:updated', ({ queue: updatedQueue, currentSong: updatedSong }) => {
      setQueue(updatedQueue);
      if (updatedSong !== undefined) {
        setCurrentSong(updatedSong);
      }
    });

    socket.on('player:song-changed', ({ song, queue: updatedQueue }) => {
      setCurrentSong(song);
      setQueue(updatedQueue);
    });

    socket.on('player:state-sync', (state) => {
      setPlayerState(prev => ({ ...prev, ...state }));
    });

    socket.on('player:lyrics-offset-sync', ({ offset }) => {
      setPlayerState(prev => ({ ...prev, lyricsOffset: offset }));
    });

    socket.on('voice:speaking', ({ userId, isSpeaking }) => {
      setSpeakingUsers(prev => ({ ...prev, [userId]: isSpeaking }));
    });

    return () => {
      socket.off('room:members-updated');
      socket.off('character:updated');
      socket.off('queue:updated');
      socket.off('player:song-changed');
      socket.off('player:state-sync');
      socket.off('player:lyrics-offset-sync');
      socket.off('voice:speaking');
    };
  }, [socket]);

  const value = {
    room,
    members,
    characters,
    queue,
    currentSong,
    playerState,
    speakingUsers,
    createRoom,
    joinRoom,
    leaveRoom,
    selectCharacter,
    addToQueue,
    removeFromQueue,
    skipSong,
    adjustLyricsOffset,
    setupListeners
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
}
