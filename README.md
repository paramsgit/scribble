# Scribble - Real-Time Multiplayer Drawing & Guessing Game

A full-stack real-time multiplayer drawing and guessing game built with React, Node.js, Socket.IO, and Redis. Players take turns drawing words while others guess, with real-time synchronization, scoring, and AI-powered drawing recognition.

## 🎮 Features

- **Real-Time Multiplayer Gameplay**: Up to 6 players per room with live drawing synchronization
- **Interactive Drawing Board**: Canvas-based drawing with color selection, undo functionality, and eraser tool
- **Word Guessing System**: Players guess the word being drawn with real-time feedback
- **Scoring System**: Dynamic scoring based on how quickly players guess correctly
- **Room Management**: Automatic room creation and player matching
- **Game States**: State machine pattern with Waiting, Drawing, and Finished states
- **Persistent State**: Redis-based game state persistence with automatic TTL management
- **Responsive UI**: Modern, responsive design built with React and Tailwind CSS

## 🛠️ Tech Stack

### Backend

- **Node.js** with **Express** - RESTful API server
- **TypeScript** - Type-safe development
- **Socket.IO** - Real-time bidirectional communication
- **Redis** (ioredis) - State persistence and room management
- **Docker** - Containerization

### Frontend

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **Canvas API** - Drawing functionality

## 📁 Project Structure

```
scribble/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app configuration
│   │   ├── server.ts              # Server entry point
│   │   ├── controllers/           # API controllers
│   │   │   ├── apiController.ts
│   │   │   └── drawingGuesser.ts  # AI drawing recognition
│   │   ├── game/                  # Game logic
│   │   │   ├── game.ts            # Core game class
│   │   │   ├── gameManager.ts     # Game instance management
│   │   │   ├── roomManager.ts     # Room and player management
│   │   │   └── states/            # Game state machine
│   │   │       ├── gameState.ts
│   │   │       ├── waitingState.ts
│   │   │       ├── drawingState.ts
│   │   │       └── finishedState.ts
│   │   ├── sockets/               # Socket.IO handlers
│   │   │   ├── socketManager.ts
│   │   │   ├── handleSocketConnection.ts
│   │   │   └── connectToRedis.ts
│   │   ├── routes/                # API routes
│   │   └── middleware/            # Express middleware
│   ├── config/                    # Configuration
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── frontend/
    ├── src/
    │   ├── App.tsx                # Main app component
    │   ├── pages/                 # Page components
    │   │   ├── Home.tsx
    │   │   └── Game.tsx
    │   ├── components/            # React components
    │   │   ├── composed/          # Composite components
    │   │   └── game/              # Game-specific components
    │   │       ├── DrawingBoard.tsx
    │   │       ├── ChatContainer.tsx
    │   │       ├── Players.tsx
    │   │       └── GameLayout.tsx
    │   ├── context/               # React context providers
    │   ├── utils/                 # Utility functions
    │   └── config/                # Frontend configuration
    ├── Dockerfile
    └── docker-compose.yml
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20 or higher)
- **npm** or **yarn**
- **Redis** (for local development) or Docker
- **Docker** and **Docker Compose** (optional, for containerized deployment)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd scribble
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Setup

1. **Backend Environment Variables**

   Create a `.env` file in the `backend/` directory:

   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   REDIS_URL=redis://localhost:6379
   ```

2. **Frontend Configuration**

   Update the socket connection URL in `frontend/src/utils/socket.ts` if needed:

   ```typescript
   SocketManager.instance = io("http://localhost:5000/");
   ```

### Running Locally

#### Option 1: Run with Docker Compose (Recommended)

**Backend:**

```bash
cd backend
docker-compose up
```

**Frontend:**

```bash
cd frontend
docker-compose up
```

#### Option 2: Run Manually

1. **Start Redis** (if not using Docker)

   ```bash
   redis-server
   ```

2. **Start Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

   Server will run on `http://localhost:5000`

3. **Start Frontend Development Server**

   ```bash
   cd frontend
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

**Backend:**

```bash
cd backend
npm run build
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
```

## 🎯 How to Play

1. **Join a Room**: Enter your name and avatar, then join or create a room
2. **Wait for Players**: Game starts automatically when 2+ players join
3. **Take Turns Drawing**: Each player gets a turn to draw a word
4. **Guess the Word**: Other players try to guess what's being drawn
5. **Score Points**: Faster guesses earn more points
6. **Win**: Player with the highest score wins!

## 🏗️ Architecture

### Game State Machine

The game uses a state machine pattern with three main states:

- **WaitingState**: Waiting for players to join or between rounds
- **DrawingState**: Active drawing and guessing phase
- **FinishedState**: Game completion

### Real-Time Communication

- **Socket.IO Events**:
  - `join-room`: Player joins a game room
  - `draw-command`: Drawing strokes synchronized in real-time
  - `guess`: Player submits a guess
  - `room-update`: Room player list updates
  - `word-update`: New word/round starts
  - `correct-guess`: Player guessed correctly

### Data Persistence

- **Redis** stores:

  - Game state (serialized game objects)
  - Room player lists
  - Player-to-room mappings
  - Active rooms set

- **TTL Management**: Automatic expiration (1-2 hours) for cleanup

### Drawing System

- **Command Pattern**: Drawing operations use command pattern for undo functionality
- **Debounced Emission**: Drawing commands are debounced before sending to reduce network traffic
- **Canvas Rendering**: HTML5 Canvas API for drawing operations

## 🔧 Configuration

### Game Settings

Edit `backend/config/index.ts`:

```typescript
gameTime: 20,    // Drawing time per round (seconds)
waitTime: 10,    // Wait time between rounds (seconds)
```

### CORS Settings

Configure allowed origins in `backend/config/index.ts`:

```typescript
corsOrigin: process.env.CORS_ORIGIN || "*";
```

## 📡 API Endpoints

### REST API

- `GET /api/sample` - Sample data endpoint
- `POST /api/guess` - Submit drawing image for AI recognition
  - Body: `multipart/form-data` with `image` file
  - Response: `{ message: "recognized word" }`

### Socket.IO Events

See the "Real-Time Communication" section above for event details.

## 🧪 Development

### Scripts

**Backend:**

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript
- `npm run watch` - Watch mode for TypeScript compilation
- `npm start` - Start production server

**Frontend:**

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐳 Docker Deployment

### Backend Docker

```bash
cd backend
docker-compose up -d
```

Includes:

- Node.js application container
- Redis container
- Automatic dependency management

### Frontend Docker

```bash
cd frontend
docker-compose up -d
```

Includes:

- Multi-stage build (Node.js build + Nginx serve)
- Nginx configuration for static file serving
- Production-optimized build

## 🔐 Security Notes

- **API Keys**: The Google Gemini API key is currently hardcoded in `drawingGuesser.ts`. Move this to environment variables in production.
- **CORS**: Configure appropriate CORS origins for production
- **Redis**: Secure Redis instance in production (password, network isolation)

## 🚧 Future Enhancements

- [ ] User authentication and profiles
- [ ] Custom word lists and categories
- [ ] Private rooms with passwords
- [ ] Spectator mode
- [ ] Drawing history and replays
- [ ] Mobile app support
- [ ] Enhanced AI drawing analysis
- [ ] Leaderboards and statistics
- [ ] Custom avatars and themes

## 📝 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on the repository.

---
