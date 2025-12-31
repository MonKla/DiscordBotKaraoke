import { Room } from '../models/Room.js';

/**
 * Room Manager - Handles all karaoke rooms (in-memory storage)
 */
export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
    this.guildToRoom = new Map(); // guildId -> roomCode
  }

  /**
   * Generate a random 4-character room code
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (I, O, 0, 1)
    let code;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code)); // Ensure unique
    return code;
  }

  /**
   * Link a guild ID to a room code
   */
  linkGuildToRoom(guildId, roomCode) {
    this.guildToRoom.set(guildId, roomCode.toUpperCase());
  }

  /**
   * Create a new room
   */
  createRoom(options = {}) {
    const code = this.generateRoomCode();
    const room = new Room({
      code,
      ...options
    });

    this.rooms.set(code, room);
    
    if (options.guildId) {
      this.guildToRoom.set(options.guildId, code);
    }

    console.log(`🎵 Room created: ${code}`);
    return room;
  }

  /**
   * Get room by code
   */
  getRoom(code) {
    return this.rooms.get(code?.toUpperCase());
  }

  /**
   * Get room by Discord guild ID
   */
  getRoomByGuildId(guildId) {
    const code = this.guildToRoom.get(guildId);
    return code ? this.rooms.get(code) : null;
  }

  /**
   * Delete a room
   */
  deleteRoom(code) {
    const room = this.rooms.get(code);
    if (room) {
      if (room.guildId) {
        this.guildToRoom.delete(room.guildId);
      }
      this.rooms.delete(code);
      console.log(`🗑️ Room deleted: ${code}`);
      return true;
    }
    return false;
  }

  /**
   * Get all active rooms (for debugging)
   */
  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => room.toJSON());
  }

  /**
   * Clean up inactive rooms (optional, can be called periodically)
   */
  cleanupInactiveRooms(maxAgeMs = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivity > maxAgeMs && room.clients.size === 0) {
        this.deleteRoom(code);
      }
    }
  }
}
