/**
 * Room Model - Represents a karaoke room
 */
export class Room {
  constructor(options = {}) {
    this.code = options.code;
    this.guildId = options.guildId || null;
    this.voiceChannelId = options.voiceChannelId || null;
    this.voiceChannelName = options.voiceChannelName || '';
    this.creatorId = options.creatorId || null;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    
    // Connected clients (socket IDs)
    this.clients = new Map(); // socketId -> { odescribe, odescribe (username), characterId, isHost }

    // Discord members in voice channel
    this.discordMembers = [];

    // Song queue
    this.queue = [];

    // Song history (for "previous" functionality)
    this.history = [];

    // Currently playing song
    this.currentSong = null;

    // Player state
    this.playerState = {
      isPlaying: false,
      currentTime: 0,
      lyricsOffset: 0
    };

    // Available characters/avatars
    this.characters = this.generateDefaultCharacters();
  }

  /**
   * Generate default character set (customizable avatars)
   */
  generateDefaultCharacters() {
    const colors = [
      { name: 'Ruby', primary: '#E53E3E', secondary: '#FC8181' },
      { name: 'Sapphire', primary: '#3182CE', secondary: '#63B3ED' },
      { name: 'Emerald', primary: '#38A169', secondary: '#68D391' },
      { name: 'Amber', primary: '#D69E2E', secondary: '#F6E05E' },
      { name: 'Violet', primary: '#805AD5', secondary: '#B794F4' },
      { name: 'Coral', primary: '#ED8936', secondary: '#FBD38D' },
      { name: 'Teal', primary: '#319795', secondary: '#4FD1C5' },
      { name: 'Rose', primary: '#D53F8C', secondary: '#F687B3' }
    ];

    return colors.map((color, index) => ({
      id: `char_${index + 1}`,
      name: color.name,
      primaryColor: color.primary,
      secondaryColor: color.secondary,
      assignedTo: null, // odescribe of assigned user
      accessories: []
    }));
  }

  /**
   * Add a client to the room
   */
  addClient(socketId, clientInfo) {
    this.clients.set(socketId, {
      odescribe: clientInfo.odescribe || null,
      characterId: clientInfo.characterId || null,
      isHost: clientInfo.isHost || false,
      joinedAt: Date.now()
    });
    this.updateActivity();
    return this.clients.get(socketId);
  }

  /**
   * Remove a client from the room
   */
  removeClient(socketId) {
    const client = this.clients.get(socketId);
    if (client && client.characterId) {
      // Unassign character
      const character = this.characters.find(c => c.id === client.characterId);
      if (character) {
        character.assignedTo = null;
      }
    }
    this.clients.delete(socketId);
    this.updateActivity();
  }

  /**
   * Assign a discord user to a character
   */
  assignCharacter(odescribe, characterId) {
    // Unassign from previous character
    this.characters.forEach(char => {
      if (char.assignedTo === odescribe) {
        char.assignedTo = null;
      }
    });

    // Assign to new character
    const character = this.characters.find(c => c.id === characterId);
    if (character && !character.assignedTo) {
      character.assignedTo = odescribe;
      this.updateActivity();
      return true;
    }
    return false;
  }

  /**
   * Update Discord members list
   */
  updateDiscordMembers(members) {
    this.discordMembers = members;
    this.updateActivity();
  }

  /**
   * Add song to queue
   */
  addToQueue(song) {
    this.queue.push({
      id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...song,
      addedAt: Date.now()
    });
    this.updateActivity();
    return this.queue[this.queue.length - 1];
  }

  /**
   * Remove song from queue
   */
  removeFromQueue(songId) {
    const index = this.queue.findIndex(s => s.id === songId);
    if (index > -1) {
      this.queue.splice(index, 1);
      this.updateActivity();
      return true;
    }
    return false;
  }

  /**
   * Play next song in queue
   */
  playNext() {
    if (this.queue.length > 0) {
      if (this.currentSong) {
        this.history.push(this.currentSong);
        // Keep history at reasonable size
        if (this.history.length > 50) this.history.shift();
      }
      this.currentSong = this.queue.shift();
      this.playerState.isPlaying = true;
      this.playerState.currentTime = 0;
      this.updateActivity();
      return this.currentSong;
    }
    return null;
  }

  /**
   * Play previous song from history
   */
  playPrevious() {
    if (this.history.length > 0) {
      // Put current song back to front of queue
      if (this.currentSong) {
        this.queue.unshift(this.currentSong);
      }
      this.currentSong = this.history.pop();
      this.playerState.isPlaying = true;
      this.playerState.currentTime = 0;
      this.updateActivity();
      return this.currentSong;
    }
    return null;
  }

  /**
   * Update player state
   */
  updatePlayerState(state) {
    this.playerState = { ...this.playerState, ...state };
    this.updateActivity();
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Convert to JSON (for API responses)
   */
  toJSON() {
    return {
      code: this.code,
      guildId: this.guildId,
      voiceChannelName: this.voiceChannelName,
      createdAt: this.createdAt,
      clientCount: this.clients.size,
      discordMembers: this.discordMembers,
      characters: this.characters,
      queue: this.queue,
      currentSong: this.currentSong,
      playerState: this.playerState
    };
  }
}
