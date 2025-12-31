import { 
  Client, 
  GatewayIntentBits, 
  Events,
  Collection
} from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection
} from '@discordjs/voice';

/**
 * Discord Bot for Karaoke Party
 * Handles voice channel connections and speaking detection
 */
export class DiscordBot {
  constructor(io, roomManager) {
    this.io = io;
    this.roomManager = roomManager;
    this.client = null;
    this.voiceConnections = new Map(); // guildId -> VoiceConnection
    this.speakingUsers = new Map(); // odescribe -> boolean
    this.ready = false;
  }

  /**
   * Initialize the Discord client
   */
  async initialize() {
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not set in environment variables');
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    // Setup event handlers
    this.setupEventHandlers();

    // Login to Discord
    await this.client.login(process.env.DISCORD_BOT_TOKEN);
    
    return this;
  }

  /**
   * Setup Discord event handlers
   */
  setupEventHandlers() {
    // Bot ready
    this.client.once(Events.ClientReady, (client) => {
      this.ready = true;
      console.log(`\n🤖 Discord Bot logged in as ${client.user.tag}`);
      console.log(`   Serving ${client.guilds.cache.size} guild(s)\n`);
    });

    // Voice state updates (join/leave/mute etc)
    this.client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      this.handleVoiceStateUpdate(oldState, newState);
    });

    // Message handler for commands
    this.client.on(Events.MessageCreate, (message) => {
      this.handleMessage(message);
    });

    // Error handling
    this.client.on(Events.Error, (error) => {
      console.error('Discord client error:', error);
    });
  }

  /**
   * Handle voice state updates
   */
  handleVoiceStateUpdate(oldState, newState) {
    const guildId = newState.guild.id;
    
    // Find room associated with this guild
    const room = this.roomManager.getRoomByGuildId(guildId);
    if (!room) return;

    // User joined voice channel
    if (!oldState.channelId && newState.channelId) {
      this.updateRoomMembers(room, guildId);
    }
    
    // User left voice channel
    if (oldState.channelId && !newState.channelId) {
      this.updateRoomMembers(room, guildId);
    }
  }

  /**
   * Update room members from voice channel
   */
  async updateRoomMembers(room, guildId) {
    const connection = this.voiceConnections.get(guildId);
    if (!connection) return;

    const channel = this.client.channels.cache.get(room.voiceChannelId);
    if (!channel) return;

    const members = [];
    channel.members.forEach(member => {
      if (!member.user.bot) {
        members.push({
          userId: member.user.id,
          username: member.user.username,
          displayName: member.displayName,
          avatar: member.user.displayAvatarURL({ size: 128 }),
          isSpeaking: this.speakingUsers.get(member.user.id) || false
        });
      }
    });

    room.updateDiscordMembers(members);
    
    // Emit to room
    this.io.to(room.code).emit('room:members-updated', members);
  }

  /**
   * Handle chat messages for commands
   */
  async handleMessage(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith('!karaoke')) return;

    const args = message.content.slice(9).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    switch (command) {
      case 'create':
        await this.handleCreateRoom(message);
        break;
      case 'join':
        await this.handleJoinVoice(message, args[0]);
        break;
      case 'leave':
        await this.handleLeaveVoice(message);
        break;
      case 'help':
        await this.sendHelp(message);
        break;
      default:
        await this.sendHelp(message);
    }
  }

  /**
   * Create a new karaoke room
   */
  async handleCreateRoom(message) {
    const member = message.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      return message.reply('❌ กรุณาเข้า Voice Channel ก่อนสร้างห้อง!');
    }

    // Create room
    const room = this.roomManager.createRoom({
      guildId: message.guild.id,
      voiceChannelId: voiceChannel.id,
      voiceChannelName: voiceChannel.name,
      creatorId: message.author.id
    });

    try {
      // Join voice channel
      await this.joinVoice(message.guild.id, voiceChannel);

      // Update members
      await this.updateRoomMembers(room, message.guild.id);

      message.reply(`
🎤 **Karaoke Room Created!**

📌 **Room Code:** \`${room.code}\`
🔊 **Voice Channel:** ${voiceChannel.name}

**เปิดเว็บและใส่ Room Code เพื่อเริ่มร้องเพลง!**
      `);
    } catch (error) {
      console.error('Failed to initialize room voice connection:', error);
      message.reply(`⚠️ สร้างห้องสำเร็จ แต่ Bot เข้า Voice Channel ไม่ได้: ${error.message}`);
    }
  }

  /**
   * Join a voice channel
   */
  /**
   * Join a voice channel
   */
  async joinVoice(guildId, voiceChannel) {
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
      });

      // Wait for connection to be ready
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      // Setup speaking detection
      connection.receiver.speaking.on('start', (userId) => {
        this.handleSpeakingStart(guildId, userId);
      });

      connection.receiver.speaking.on('end', (userId) => {
        this.handleSpeakingEnd(guildId, userId);
      });

      this.voiceConnections.set(guildId, connection);
      console.log(`🔊 Joined voice channel: ${voiceChannel.name}`);

      return connection;
    } catch (error) {
      console.error('Error joining voice channel:', error);
      // Clean up if connection failed
      const connection = getVoiceConnection(guildId);
      if (connection) {
        connection.destroy();
      }
      // Re-throw handled error so caller knows it failed, but we logged it
      throw new Error(`Failed to join voice channel: ${error.message}`);
    }
  }

  /**
   * Handle join voice command
   */
  async handleJoinVoice(message, roomCode) {
    const member = message.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      return message.reply('❌ กรุณาเข้า Voice Channel ก่อน!');
    }

    if (!roomCode) {
      return message.reply('❌ กรุณาใส่ Room Code! เช่น `!karaoke join ABCD`');
    }

    const room = this.roomManager.getRoom(roomCode.toUpperCase());
    if (!room) {
      return message.reply('❌ ไม่พบห้อง! กรุณาตรวจสอบ Room Code');
    }

    // Update room with this voice channel
    room.voiceChannelId = voiceChannel.id;
    room.guildId = message.guild.id;

    // Link guild to room
    this.roomManager.linkGuildToRoom(message.guild.id, roomCode);
    console.log(`🔗 Linked Guild [${message.guild.id}] to Room [${roomCode}]`);
    
    // Join voice
    await this.joinVoice(message.guild.id, voiceChannel);
    await this.updateRoomMembers(room, message.guild.id);

    message.reply(`✅ Bot เข้าร่วมห้อง **${roomCode}** แล้ว!`);
  }

  /**
   * Handle leave voice command
   */
  async handleLeaveVoice(message) {
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      this.voiceConnections.delete(message.guild.id);
      message.reply('👋 ออกจาก Voice Channel แล้ว!');
    } else {
      message.reply('❌ Bot ไม่ได้อยู่ใน Voice Channel');
    }
  }

  /**
   * Handle speaking start event
   */
  handleSpeakingStart(guildId, userId) {
    this.speakingUsers.set(userId, true);
    
    const room = this.roomManager.getRoomByGuildId(guildId);
    if (room) {
      this.io.to(room.code).emit('voice:speaking', {
        userId: userId,
        isSpeaking: true
      });
    }
  }

  /**
   * Handle speaking end event
   */
  handleSpeakingEnd(guildId, userId) {
    this.speakingUsers.set(userId, false);
    
    const room = this.roomManager.getRoomByGuildId(guildId);
    if (room) {
      this.io.to(room.code).emit('voice:speaking', {
        userId: userId,
        isSpeaking: false
      });
    }
  }

  /**
   * Send help message
   */
  async sendHelp(message) {
    message.reply(`
🎤 **Karaoke Party Commands**

\`!karaoke create\` - สร้างห้องคาราโอเกะใหม่
\`!karaoke join <code>\` - เชื่อมต่อ Bot กับห้อง
\`!karaoke leave\` - ออกจาก Voice Channel
\`!karaoke help\` - แสดงคำสั่งทั้งหมด
    `);
  }

  /**
   * Get guild members in voice channel
   */
  getVoiceMembers(guildId, channelId) {
    const channel = this.client.channels.cache.get(channelId);
    if (!channel) return [];

    const members = [];
    channel.members.forEach(member => {
      if (!member.user.bot) {
        members.push({
          userId: member.user.id,
          username: member.user.username,
          displayName: member.displayName,
          avatar: member.user.displayAvatarURL({ size: 128 })
        });
      }
    });

    return members;
  }

  /**
   * Check if bot is ready
   */
  isReady() {
    return this.ready;
  }

  /**
   * Get client
   */
  getClient() {
    return this.client;
  }
}
