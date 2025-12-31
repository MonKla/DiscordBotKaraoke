/**
 * Socket.io Event Handlers
 */
export function setupSocketHandlers(io, roomManager, discordBot) {
  io.on('connection', (socket) => {
    console.log(`📱 Client connected: ${socket.id}`);

    let currentRoom = null;

    // ===== Room Events =====

    /**
     * Create a new room (from web)
     */
    socket.on('room:create', (callback) => {
      const room = roomManager.createRoom();
      currentRoom = room.code;
      socket.join(room.code);
      room.addClient(socket.id, { isHost: true });
      
      console.log(`🎵 Room created via web: ${room.code}`);
      callback({ success: true, room: room.toJSON() });
    });

    /**
     * Join an existing room
     */
    socket.on('room:join', ({ roomCode, isHost }, callback) => {
      const room = roomManager.getRoom(roomCode);
      
      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      currentRoom = room.code;
      socket.join(room.code);
      room.addClient(socket.id, { isHost: isHost || false });

      // Notify others
      socket.to(room.code).emit('room:client-joined', {
        socketId: socket.id,
        clientCount: room.clients.size
      });

      console.log(`👤 Client joined room: ${room.code} (${room.clients.size} clients)`);
      callback({ success: true, room: room.toJSON() });
    });

    /**
     * Leave current room
     */
    socket.on('room:leave', (callback) => {
      if (currentRoom) {
        const room = roomManager.getRoom(currentRoom);
        if (room) {
          room.removeClient(socket.id);
          socket.leave(currentRoom);
          
          // Notify others
          io.to(currentRoom).emit('room:client-left', {
            socketId: socket.id,
            clientCount: room.clients.size
          });
          
          console.log(`👋 Client left room: ${currentRoom}`);
        }
        currentRoom = null;
      }
      callback?.({ success: true });
    });

    // ===== Character/Avatar Events =====

    /**
     * Select a character
     */
    socket.on('character:select', ({ odescribe, characterId }, callback) => {
      if (!currentRoom) {
        return callback({ success: false, error: 'Not in a room' });
      }

      const room = roomManager.getRoom(currentRoom);
      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      const success = room.assignCharacter(odescribe, characterId);
      if (success) {
        // Notify all clients in room
        io.to(currentRoom).emit('character:updated', {
          characters: room.characters
        });
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Character already taken' });
      }
    });

    // ===== Queue Events =====

    /**
     * Add song to queue
     */
    socket.on('queue:add', (songData, callback) => {
      if (!currentRoom) {
        return callback({ success: false, error: 'Not in a room' });
      }

      const room = roomManager.getRoom(currentRoom);
      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      const song = room.addToQueue(songData);
      
      // Notify all clients
      io.to(currentRoom).emit('queue:updated', {
        queue: room.queue,
        currentSong: room.currentSong
      });

      // Auto-play if no current song
      if (!room.currentSong) {
        const nextSong = room.playNext();
        if (nextSong) {
          io.to(currentRoom).emit('player:song-changed', {
            song: nextSong,
            queue: room.queue
          });
        }
      }

      callback({ success: true, song });
    });

    /**
     * Remove song from queue
     */
    socket.on('queue:remove', ({ songId }, callback) => {
      if (!currentRoom) {
        return callback({ success: false, error: 'Not in a room' });
      }

      const room = roomManager.getRoom(currentRoom);
      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      const success = room.removeFromQueue(songId);
      if (success) {
        io.to(currentRoom).emit('queue:updated', {
          queue: room.queue,
          currentSong: room.currentSong
        });
      }

      callback({ success });
    });

    /**
     * Skip to next song
     */
    socket.on('queue:skip', (callback) => {
      if (!currentRoom) {
        return callback?.({ success: false, error: 'Not in a room' });
      }

      const room = roomManager.getRoom(currentRoom);
      if (!room) {
        return callback?.({ success: false, error: 'Room not found' });
      }

      const nextSong = room.playNext();
      io.to(currentRoom).emit('player:song-changed', {
        song: nextSong,
        queue: room.queue
      });

      callback?.({ success: true, song: nextSong });
    });

    // ===== Player Events =====

    /**
     * Update player state (sync across clients)
     */
    socket.on('player:state', (state) => {
      if (!currentRoom) return;

      const room = roomManager.getRoom(currentRoom);
      if (!room) return;

      room.updatePlayerState(state);

      // Broadcast to other clients (not sender)
      socket.to(currentRoom).emit('player:state-sync', state);
    });

    /**
     * Adjust lyrics offset
     */
    socket.on('player:lyrics-offset', ({ offset }) => {
      if (!currentRoom) return;

      const room = roomManager.getRoom(currentRoom);
      if (!room) return;

      room.playerState.lyricsOffset = offset;

      // Broadcast to all clients
      io.to(currentRoom).emit('player:lyrics-offset-sync', { offset });
    });

    // ===== Disconnect =====

    socket.on('disconnect', () => {
      if (currentRoom) {
        const room = roomManager.getRoom(currentRoom);
        if (room) {
          const removedClient = room.removeClient(socket.id);
          
          // If the host disconnects or the room is empty, consider cleaning up
          // For now, we'll just cleanup if the room is empty to allow re-connections
          if (room.clients.size === 0) {
            console.log(`🧹 Room ${currentRoom} is empty. Cleaning up in 5 minutes if no one rejoins...`);
            // In a real app, you might set a timeout here.
            // For this user requirement "terminate process if exit web", we can be aggressive:
            if (removedClient?.role === 'host') {
               console.log(`🔌 Host left room [${currentRoom}]. Destroying room.`);
               roomManager.deleteRoom(currentRoom);
               // If bot is connected, we should probably tell it to leave too, but room deletion handles the logic
            }
          } else {
            // Notify others
            io.to(currentRoom).emit('room:client-left', {
              socketId: socket.id,
              clientCount: room.clients.size
            });
          }
        }
      }
      console.log(`📴 Client disconnected: ${socket.id}`);
    });
  });
}
