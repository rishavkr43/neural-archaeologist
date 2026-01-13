import socketio
from typing import Dict, Set

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'  # Allow frontend to connect
)

# Track active connections per investigation
active_connections: Dict[str, Set[str]] = {}


async def emit_agent_message(investigation_id: str, agent_name: str, message: str, data: dict = None):
    """Emit agent message to all clients watching this investigation"""
    await sio.emit(
        'agent_message',
        {
            'investigation_id': investigation_id,
            'agent_name': agent_name,
            'message': message,
            'data': data or {},
            'timestamp': None  # Will be added by client
        },
        room=investigation_id
    )


async def emit_confidence_update(investigation_id: str, confidence: int):
    """Emit confidence score update"""
    await sio.emit(
        'confidence_update',
        {
            'investigation_id': investigation_id,
            'confidence': confidence
        },
        room=investigation_id
    )


async def emit_investigation_complete(investigation_id: str):
    """Emit completion event"""
    await sio.emit(
        'investigation_complete',
        {
            'investigation_id': investigation_id
        },
        room=investigation_id
    )


async def emit_investigation_error(investigation_id: str, error: str):
    """Emit error event"""
    await sio.emit(
        'investigation_error',
        {
            'investigation_id': investigation_id,
            'error': error
        },
        room=investigation_id
    )


# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Client connected"""
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    """Client disconnected"""
    print(f"Client disconnected: {sid}")


@sio.event
async def subscribe(sid, data):
    """Client subscribes to investigation updates"""
    investigation_id = data.get('investigation_id')
    if investigation_id:
        # Join room for this investigation
        await sio.enter_room(sid, investigation_id)
        print(f"Client {sid} subscribed to investigation {investigation_id}")
        
        # Send acknowledgment
        await sio.emit('subscribed', {'investigation_id': investigation_id}, room=sid)


@sio.event
async def unsubscribe(sid, data):
    """Client unsubscribes from investigation"""
    investigation_id = data.get('investigation_id')
    if investigation_id:
        await sio.leave_room(sid, investigation_id)
        print(f"Client {sid} unsubscribed from investigation {investigation_id}")