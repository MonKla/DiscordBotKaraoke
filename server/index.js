import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // Added helmet for Security Headers
import 'libsodium-wrappers'; // Patched for Node 25 compat
import 'opusscript'; // Ensure Opus encoder is loaded
import '@snazzah/davey'; // Fix DAVE protocol missing module error
import { DiscordBot } from './bot/discord.js';
import { RoomManager } from './managers/RoomManager.js';
import { setupSocketHandlers } from './socket/handlers.js';
import { YouTube } from 'youtube-sr';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Use Helmet for security headers (including CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "https://discord.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com", "https://s.ytimg.com"],
      frameSrc: ["'self'", "https://www.youtube.com"],
      imgSrc: ["'self'", "data:", "https://i.ytimg.com", "https://cdn.discordapp.com"]
    }
  },
  crossOriginEmbedderPolicy: false // Required for some YouTube functionality
}));

// Silence Chrome DevTools probe (Handle all methods)
app.use('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.sendStatus(200);
});

// CORS configuration
const corsOptions = {
  origin: true, // Allow any origin (for local network usage)
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.io setup
const io = new Server(httpServer, {
  cors: corsOptions
});

// Initialize managers
const roomManager = new RoomManager();
const discordBot = new DiscordBot(io, roomManager);

// Setup socket handlers
setupSocketHandlers(io, roomManager, discordBot);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    botConnected: discordBot.isReady()
  });
});

// Root endpoint to prevent "Cannot GET /" 404
app.get('/', (req, res) => {
  res.send('🎤 Discord Karaoke Party Server is running!');
});

// Search YouTube
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    console.log(`🔎 Searching: ${query}`);
    const results = await YouTube.search(query, { 
      limit: 10,
      type: 'video',
      safeSearch: true 
    });

    const videos = results.map(video => ({
      videoId: video.id,
      title: video.title,
      artist: video.channel.name,
      thumbnail: video.thumbnail?.url || '',
      duration: video.durationFormatted
    }));

    res.json(videos);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
});

// Get room info
app.get('/api/room/:roomCode', (req, res) => {
  const room = roomManager.getRoom(req.params.roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room.toJSON());
});

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎤 Discord Karaoke Party Server                            ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                                              ║
║   Server running on: http://localhost:${PORT}                  ║
║   Socket.io ready for connections                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Initialize Discord Bot
discordBot.initialize().catch(err => {
  console.error('Failed to initialize Discord bot:', err.message);
  console.log('\n⚠️  Bot not connected. Please check your DISCORD_BOT_TOKEN in .env file');
});

export { io, roomManager, discordBot };
