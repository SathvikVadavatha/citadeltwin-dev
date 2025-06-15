
import { useEffect, useState } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  userColor: string;
}

interface LiveCursorsProps {
  projectId: string;
  onCursorMove?: (position: { x: number; y: number }) => void;
}

export const LiveCursors = ({ projectId, onCursorMove }: LiveCursorsProps) => {
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const { userPresence, updateCursorPosition } = useCollaboration(projectId);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = async (event: MouseEvent) => {
      const position = { x: event.clientX, y: event.clientY };
      await updateCursorPosition(position);
      onCursorMove?.(position);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [updateCursorPosition, onCursorMove]);

  // Update cursors from presence data
  useEffect(() => {
    const activeCursors: CursorPosition[] = userPresence
      .filter(presence => presence.cursor_position && presence.is_active)
      .map(presence => {
        // Type guard and safe access to cursor position
        const cursorPos = presence.cursor_position as { x: number; y: number } | null;
        if (!cursorPos || typeof cursorPos !== 'object' || !('x' in cursorPos) || !('y' in cursorPos)) {
          return null;
        }

        return {
          x: cursorPos.x,
          y: cursorPos.y,
          userId: presence.user_id || '',
          userName: (presence as any).profiles?.full_name || 'Anonymous',
          userColor: presence.user_color,
        };
      })
      .filter((cursor): cursor is CursorPosition => cursor !== null);

    setCursors(activeCursors);
  }, [userPresence]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="drop-shadow-lg"
          >
            <path
              d="M2 2L18 10L10 12L8 18L2 2Z"
              fill={cursor.userColor}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          
          {/* User Name Label */}
          <div
            className="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white font-medium shadow-lg pointer-events-none whitespace-nowrap"
            style={{ backgroundColor: cursor.userColor }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
};
