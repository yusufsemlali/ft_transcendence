# Chat Service Architecture

A production-ready Express + Socket.io chat service with a scalable service-based architecture.

## Project Structure

```
src/
├── server.ts                 # Main entry point
├── config/
│   └── socket.ts            # Socket.io configuration
├── controllers/
│   └── socketController.ts  # Socket.io event handlers
├── services/
│   ├── socketService.ts     # Socket.io business logic
│   ├── messageService.ts    # Message handling & storage
│   └── userService.ts       # User management
├── middleware/              # Custom middleware (future)
├── routes/                  # REST API routes (future)
└── utils/                   # Helper utilities (future)

public/
└── index.html              # Web test client
```

## Architecture Overview

### Services Layer

#### 1. **UserService** (`src/services/userService.ts`)
Manages user state and metadata.

**Key Methods:**
- `addUser(socketId, user, room)` - Register a new user
- `removeUser(userId)` - Remove user
- `getUserBySocketId(socketId)` - Find user by socket ID
- `getUsersInRoom(room)` - Get all users in a room
- `updateUserRoom(userId, room)` - Update user's current room

```typescript
import userService from './services/userService';

userService.addUser(socket.id, user, 'general');
const users = userService.getUsersInRoom('general');
```

#### 2. **MessageService** (`src/services/messageService.ts`)
Handles message storage and retrieval.

**Key Methods:**
- `addMessage(userId, username, content, room)` - Save a message
- `getMessagesByRoom(room, limit)` - Retrieve messages from a room
- `getMessageHistory(limit)` - Get all messages across rooms
- `clearRoomMessages(room)` - Delete room messages

```typescript
import messageService from './services/messageService';

const message = messageService.addMessage(userId, username, 'Hello!', 'general');
const history = messageService.getMessagesByRoom('general', 50);
```

#### 3. **SocketService** (`src/services/socketService.ts`)
Orchestrates Socket.io operations and coordinates between services.

**Key Methods:**
- `userJoinRoom(socket, user, room)` - Handle user joining
- `userLeaveRoom(socket)` - Handle user leaving
- `broadcastMessage(socket, content)` - Send message to room
- `broadcastUserTyping(socket, isTyping)` - Broadcast typing indicator
- `getRoomInfo(room)` - Get room statistics
- `getStats()` - Get server statistics

```typescript
const socketService = new SocketService(io);
socketService.userJoinRoom(socket, user, 'general');
socketService.broadcastMessage(socket, 'Hello everyone!');
```

### Controller Layer

#### SocketController (`src/controllers/socketController.ts`)
Handles incoming Socket.io events and delegates to services.

**Event Handlers:**
- `handleConnection(socket)` - New connection
- `handleUserJoin(socket, data)` - user:join event
- `handleMessage(socket, data)` - message:send event
- `handleTyping(socket, data)` - user:typing event
- `handleDisconnect(socket)` - Disconnection

## Socket.io Events

### Emitted by Client

#### Connection
- **`user:join`** - Join a room
  ```javascript
  socket.emit('user:join', {
    user: { id, username, email },
    room: 'general'
  });
  ```

#### Messaging
- **`message:send`** - Send a message
  ```javascript
  socket.emit('message:send', { content: 'Hello!' });
  ```

#### Presence
- **`user:typing`** - Broadcast typing indicator
  ```javascript
  socket.emit('user:typing', { isTyping: true });
  ```

#### Info
- **`room:getInfo`** - Get room information
- **`server:getStats`** - Get server statistics

### Emitted by Server

#### Connection
- **`connection:success`** - Connection established
- **`room:joined`** - Successfully joined room

#### Messaging
- **`message:new`** - New message in room
  ```javascript
  {
    id: string,
    userId: string,
    username: string,
    content: string,
    timestamp: Date
  }
  ```

#### User Management
- **`user:joined`** - User joined room
- **`user:left`** - User left room
- **`users:list`** - Current users in room
- **`messages:history`** - Previous messages

#### Typing
- **`user:typing`** - User is typing
  ```javascript
  { userId, username, isTyping }
  ```

#### Info
- **`room:info`** - Room information
- **`server:stats`** - Server statistics

#### Errors
- **`error`** - Error message

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# From chat-server directory
cd apps/chat-server
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Server runs on http://localhost:3000
# Test client available at http://localhost:3000
```

### Build & Production

```bash
# Build TypeScript
pnpm build

# Run production server
pnpm start
```

## Usage Examples

### Basic Usage

```typescript
// In socketController.ts or client
socket.on('connect', () => {
  // Join a room
  socket.emit('user:join', {
    user: {
      id: 'user123',
      username: 'John',
      email: 'john@example.com'
    },
    room: 'general'
  });
});

socket.on('room:joined', () => {
  // Send a message
  socket.emit('message:send', {
    content: 'Hello everyone!'
  });
});

socket.on('message:new', (message) => {
  console.log(`${message.username}: ${message.content}`);
});
```

## Testing

Use the built-in test client at `http://localhost:3000`:

1. Enter server URL (default: `localhost:3000`)
2. Click "Connect"
3. Enter username and room name
4. Click "Join Room"
5. Send messages and test typing indicators

## Environment Variables

Create `.env` file in `apps/chat-server/`:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication (JWT)
- [ ] Message persistence
- [ ] Direct messaging
- [ ] Room management & permissions
- [ ] File sharing
- [ ] Message reactions/editing
- [ ] Member roles (admin, moderator)
- [ ] Rate limiting
- [ ] Message search

## Performance Considerations

- Messages limited to 100 per room in memory (configurable)
- Socket.io using both WebSocket and polling for compatibility
- Automatic reconnection with exponential backoff
- CORS configured for cross-origin support

## Monitoring & Debugging

Both UserService and MessageService maintain in-memory data. Add logging via:

```typescript
console.log(`Connected users: ${userService.getAllUsers().length}`);
console.log(`Total messages: ${messageService.getTotalMessageCount()}`);
```

## License

ISC
