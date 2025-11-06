# Campus-Pass Socket.io Real-time Documentation

## Overview

Campus-Pass uses Socket.io for real-time bidirectional communication between the server and clients. This enables instant notifications, live updates, and real-time dashboard synchronization.

## Connection

### Client Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  },
  transports: ['websocket', 'polling']
});

// Connection successful
socket.on('connected', (data) => {
  console.log('Connected:', data);
  // { message: 'Connected to Campus-Pass real-time server', userId: '...', role: 0 }
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### Authentication

All Socket.io connections require JWT authentication. The token can be provided in two ways:

1. **Auth object** (recommended):
```javascript
const socket = io(SERVER_URL, {
  auth: { token: jwtToken }
});
```

2. **Authorization header**:
```javascript
const socket = io(SERVER_URL, {
  extraHeaders: {
    Authorization: `Bearer ${jwtToken}`
  }
});
```

## Rooms

Users are automatically joined to the following rooms upon connection:

- `user:{userId}` - Personal room for user-specific events
- `role:{roleNumber}` - Role-based room (0=Student, 1=Admin, 2=Warden, 3=Security)
- `hostel:{hostelName}` - Hostel-based room (for students and wardens)

## Events

### Connection Events

#### `connected`
Emitted when client successfully connects.

**Payload:**
```typescript
{
  message: string;
  userId: string;
  role: number;
}
```

**Example:**
```javascript
socket.on('connected', (data) => {
  console.log(`Connected as ${data.userId}`);
});
```

---

### Notification Events

#### `notification:new`
Emitted when a new notification is created for the user.

**Payload:**
```typescript
{
  notification: {
    _id: string;
    user: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Date;
  }
}
```

**Example:**
```javascript
socket.on('notification:new', (data) => {
  console.log('New notification:', data.notification);
  // Show toast/notification in UI
  showNotification(data.notification);
});
```

#### `notification:read`
Emitted when a notification is marked as read (to sync across devices).

**Payload:**
```typescript
{
  notificationId: string;
}
```

**Example:**
```javascript
// Emit when user reads notification
socket.emit('notification:read', { notificationId: '...' });

// Listen for read status from other devices
socket.on('notification:read', (data) => {
  markNotificationAsRead(data.notificationId);
});
```

---

### Outpass Events

#### `outpass:created`
Emitted when a new outpass is created.

**Recipients:** Student (creator), Assigned Warden, All Wardens

**Payload:**
```typescript
{
  outpass: IOutpass;
  studentId: string;
  wardenId?: string;
}
```

**Example:**
```javascript
socket.on('outpass:created', (data) => {
  console.log('New outpass created:', data.outpass.outpassNumber);
  // Update pending requests list
  refreshPendingRequests();
});
```

#### `outpass:approved`
Emitted when an outpass is approved by warden.

**Recipients:** Student, Warden

**Payload:**
```typescript
{
  outpassId: string;
  outpass: IOutpass;
  studentId: string;
  wardenId: string;
  wardenName: string;
}
```

**Example:**
```javascript
socket.on('outpass:approved', (data) => {
  console.log(`Outpass approved by ${data.wardenName}`);
  // Show success notification
  showSuccess(`Your outpass has been approved!`);
  // Update outpass status in UI
  updateOutpassStatus(data.outpassId, 'approved');
});
```

#### `outpass:rejected`
Emitted when an outpass is rejected by warden.

**Recipients:** Student, Warden

**Payload:**
```typescript
{
  outpassId: string;
  outpass: IOutpass;
  studentId: string;
  wardenId: string;
  reason: string;
}
```

**Example:**
```javascript
socket.on('outpass:rejected', (data) => {
  console.log(`Outpass rejected: ${data.reason}`);
  showError(`Outpass rejected: ${data.reason}`);
  updateOutpassStatus(data.outpassId, 'rejected');
});
```

#### `outpass:checked_out`
Emitted when a student checks out with security.

**Recipients:** Student, Security Officer, All Security

**Payload:**
```typescript
{
  outpassId: string;
  studentId: string;
  securityId: string;
  timestamp: Date;
}
```

**Example:**
```javascript
socket.on('outpass:checked_out', (data) => {
  console.log('Student checked out at', data.timestamp);
  updateOutpassStatus(data.outpassId, 'checked_out');
});
```

#### `outpass:checked_in`
Emitted when a student checks in with security.

**Recipients:** Student, Security Officer, All Security

**Payload:**
```typescript
{
  outpassId: string;
  studentId: string;
  securityId: string;
  timestamp: Date;
  isOverdue: boolean;
}
```

**Example:**
```javascript
socket.on('outpass:checked_in', (data) => {
  console.log('Student checked in at', data.timestamp);
  if (data.isOverdue) {
    showWarning('Student returned late!');
  }
  updateOutpassStatus(data.outpassId, 'checked_in');
});
```

#### `outpass:overdue`
Emitted when an outpass becomes overdue.

**Recipients:** Student, Warden, All Wardens, All Security

**Payload:**
```typescript
{
  outpassId: string;
  studentId: string;
  wardenId?: string;
  overdueBy: number; // hours
}
```

**Example:**
```javascript
socket.on('outpass:overdue', (data) => {
  console.log(`Outpass overdue by ${data.overdueBy} hours`);
  showWarning(`Student is overdue by ${data.overdueBy} hours`);
});
```

---

### Dashboard Events

#### `dashboard:update`
Emitted when dashboard statistics need to be refreshed.

**Payload:**
```typescript
{
  userId: string;
  stats: {
    [key: string]: number;
  }
}
```

**Example:**
```javascript
socket.on('dashboard:update', (data) => {
  console.log('Dashboard stats updated:', data.stats);
  updateDashboardStats(data.stats);
});
```

#### `stats:update`
Emitted when user-specific statistics are updated.

**Payload:**
```typescript
{
  userId: string;
  type: 'student' | 'warden' | 'security';
  stats: any;
}
```

---

### System Events

#### `system:alert`
Emitted for system-wide alerts.

**Payload:**
```typescript
{
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}
```

**Example:**
```javascript
socket.on('system:alert', (data) => {
  console.log(`System ${data.type}:`, data.message);
  showSystemAlert(data.type, data.title, data.message);
});
```

#### `system:maintenance`
Emitted when system enters/exits maintenance mode.

**Payload:**
```typescript
{
  enabled: boolean;
  message: string;
  estimatedDuration?: number; // minutes
}
```

**Example:**
```javascript
socket.on('system:maintenance', (data) => {
  if (data.enabled) {
    showMaintenanceMode(data.message, data.estimatedDuration);
  } else {
    hideMaintenanceMode();
  }
});
```

---

### Health Check Events

#### `ping` / `pong`
Used for connection health monitoring.

**Example:**
```javascript
// Send ping
socket.emit('ping');

// Receive pong
socket.on('pong', (data) => {
  console.log('Latency:', Date.now() - data.timestamp, 'ms');
});
```

---

## Client Implementation Examples

### React Hook

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connected', (data) => {
      console.log('Connected:', data);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return { socket, connected };
}
```

### Notification Listener

```typescript
import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

export function useNotifications(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      // Show toast notification
      toast.info(data.notification.message);
      
      // Update notification count
      updateNotificationCount();
      
      // Play sound
      playNotificationSound();
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);
}
```

### Outpass Status Listener

```typescript
import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

export function useOutpassUpdates(socket: Socket | null, onUpdate: () => void) {
  useEffect(() => {
    if (!socket) return;

    const events = [
      'outpass:created',
      'outpass:approved',
      'outpass:rejected',
      'outpass:checked_out',
      'outpass:checked_in',
      'outpass:overdue'
    ];

    events.forEach(event => {
      socket.on(event, (data) => {
        console.log(`${event}:`, data);
        onUpdate();
      });
    });

    return () => {
      events.forEach(event => socket.off(event));
    };
  }, [socket, onUpdate]);
}
```

---

## Error Handling

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  // Show error to user
  showError('Unable to connect to real-time server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected, try to reconnect
    socket.connect();
  }
});
```

---

## Best Practices

### 1. Connection Management
```javascript
// Connect only when user is authenticated
if (isAuthenticated && token) {
  socket.connect();
} else {
  socket.disconnect();
}
```

### 2. Event Cleanup
```javascript
useEffect(() => {
  socket.on('event', handler);
  
  return () => {
    socket.off('event', handler);
  };
}, [socket]);
```

### 3. Reconnection
```javascript
socket.io.on('reconnect', (attempt) => {
  console.log('Reconnected after', attempt, 'attempts');
  // Refresh data
  fetchLatestData();
});
```

### 4. Offline Detection
```javascript
socket.on('disconnect', () => {
  showOfflineIndicator();
});

socket.on('connect', () => {
  hideOfflineIndicator();
});
```

---

## Testing

### Using Socket.io Client
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your-test-token' }
});

socket.on('connected', (data) => {
  console.log('Test connection successful:', data);
});

// Test notification
socket.on('notification:new', (data) => {
  console.log('Received notification:', data);
});
```

### Using Postman/Thunder Client
Postman and Thunder Client support WebSocket connections for testing.

---

## Performance Considerations

1. **Event Throttling**: Limit event emissions to prevent overwhelming clients
2. **Room Management**: Use rooms efficiently to target specific users
3. **Payload Size**: Keep payloads small, send only necessary data
4. **Connection Pooling**: Reuse connections, avoid frequent reconnections
5. **Error Recovery**: Implement exponential backoff for reconnection attempts

---

## Security

1. **Authentication**: All connections require valid JWT
2. **Authorization**: Users only receive events they're authorized for
3. **Rate Limiting**: Prevent abuse with connection rate limits
4. **Validation**: Validate all incoming events
5. **Encryption**: Use WSS (WebSocket Secure) in production

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-05