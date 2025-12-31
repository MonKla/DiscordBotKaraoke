# 🎤 Discord Karaoke Party

ระบบคาราโอเกะแบบ Hybrid ที่ใช้ Discord เป็นตัวจัดการเสียง และ Web App เป็นหน้าจอแสดงผล

## ✨ Features

- **Room System** - สร้างห้องด้วย Room Code 4 ตัวอักษร
- **Discord Integration** - ตรวจจับ Voice Activity ผ่าน Discord Bot
- **Smart Karaoke Player** - เล่น YouTube + เนื้อเพลง Sync แบบ Real-time
- **PNG Tuber Avatars** - Avatar ขยับเมื่อพูด/ร้องเพลง
- **Mobile Controller** - ควบคุมผ่านมือถือ

## 🚀 Quick Start

### 1. ติดตั้ง Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install
```

### 2. สร้าง Discord Bot

1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. สร้าง Application ใหม่
3. ไปที่ **Bot** → เปิด Privileged Gateway Intents ทั้งหมด
4. Copy Bot Token

### 3. ตั้งค่า Environment

```bash
# Copy .env.example to .env
copy .env.example .env

# แก้ไข .env และใส่ Bot Token
```

### 4. รันโปรเจค

```bash
# รันทั้ง Server และ Client พร้อมกัน
npm run dev
```

## 📱 การใช้งาน

### บน Discord

```
!karaoke create    - สร้างห้องใหม่
!karaoke join XXXX - เข้าร่วมห้อง
!karaoke leave     - ออกจากห้อง
!karaoke help      - แสดงคำสั่ง
```

### บน Web

1. เปิด http://localhost:5173
2. เลือก "เปิดหน้าจอคาราโอเกะ" (PC) หรือ "เข้าร่วมด้วยมือถือ"
3. ใส่ Room Code ที่ได้จาก Discord

## 🛠 Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React (Vite), Framer Motion
- **Discord**: Discord.js v14, @discordjs/voice
- **APIs**: YouTube IFrame, LRCLIB (Lyrics)

## 📁 Project Structure

```
discord-karaoke/
├── server/
│   ├── index.js           # Main server
│   ├── bot/
│   │   └── discord.js     # Discord bot
│   ├── managers/
│   │   └── RoomManager.js # Room management
│   ├── models/
│   │   └── Room.js        # Room model
│   └── socket/
│       └── handlers.js    # Socket.io handlers
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app
│   └── index.html
└── package.json
```

## 🎨 Customization

### เปลี่ยนสี Avatar

แก้ไขใน `server/models/Room.js` → method `generateDefaultCharacters()`

### เพิ่ม Avatar Accessories

(Coming soon - Phase 5)

## 📝 License

MIT
