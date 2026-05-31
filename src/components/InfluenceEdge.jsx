import { useState, useContext, useEffect, useRef } from 'react';
import { getBezierPath, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import { AppContext } from '../App';

const WEIGHT_LABELS = {
  '-3': 'Strong −',
  '-2': 'Medium −',
  '-1': 'Weak −',
  '0': 'None',
  '1': 'Weak +',
  '2': 'Medium +',
  '3': 'Strong +',
};

const TIMEFRAME_COLORS = {
  short: '#3b82f6',
  middle: '#f59e0b',
  long: '#8b5cf6',
};

const TIMEFRAME_OPTIONS = [
  { value: 'short', label: 'S', title: 'Short term' },
  { value: 'middle', label: 'M', title: 'Middle term' },
  { value: 'long', label: 'L', title: 'Long term' },
];

export default function InfluenceEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0, moved: false });
  const popupRef = useRef(null);
  const { edges, updateEdgeWeight, updateEdgeTimeframe, updateEdgeLabelOffset, invertEdge, deleteEdge } = useContext(AppContext);
  const { getZoom } = useReactFlow();

  const weight = data?.weight ?? 0;
  const timeframe = data?.timeframe || 'short';
  const offsetX = data?.labelOffsetX ?? 0;
  const offsetY = data?.labelOffsetY ?? 0;
  const color = TIMEFRAME_COLORS[timeframe] || TIMEFRAME_COLORS.short;
  const strokeWidth = Math.max(1.5, Math.abs(weight) * 1.5);

  // Check if reverse edge exists (for graying out invert button)
  const reverseExists = edges.some((e) => e.source === target && e.target === source);

  // Default label position from bezier
  const [defaultPath, defaultLabelX, defaultLabelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const finalLabelX = defaultLabelX + offsetX;
  const finalLabelY = defaultLabelY + offsetY;

  // Edge path: use default bezier when no offset, custom quadratic bezier otherwise
  let edgePath;
  if (offsetX === 0 && offsetY === 0) {
    edgePath = defaultPath;
  } else {
    const cx = 2 * finalLabelX - 0.5 * sourceX - 0.5 * targetX;
    const cy = 2 * finalLabelY - 0.5 * sourceY - 0.5 * targetY;
    edgePath = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`;
  }

  // Click-outside to close editing
  useEffect(() => {
    if (!editing) return;
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setEditing(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside, true);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [editing]);

  // Drag handling
  const handleMouseDown = (e) => {
    if (editing) return;
    e.stopPropagation();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
      moved: false,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.moved = true;
      }
      if (!dragRef.current.moved) return;
      const zoom = getZoom();
      updateEdgeLabelOffset(
        id,
        dragRef.current.startOffsetX + dx / zoom,
        dragRef.current.startOffsetY + dy / zoom
      );
    };
    const handleMouseUp = () => {
      if (!dragRef.current.moved) {
        setEditing(true);
      }
      setDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, id, getZoom, updateEdgeLabelOffset]);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: color,
          strokeWidth,
          fill: 'none',
        }}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            pointerEvents: 'all',
            zIndex: editing ? 1000 : 0,
          }}
          className="nodrag nopan"
        >
          {editing ? (
            <div
              ref={popupRef}
              className="bg-white rounded-lg shadow-lg p-2 border border-gray-200 flex flex-col gap-1.5 min-w-[140px]"
            >
              <select
                value={weight}
                onChange={(e) => {
                  updateEdgeWeight(id, parseInt(e.target.value));
                }}
                autoFocus
                className="px-1 py-0.5 text-xs rounded border border-gray-300 bg-white outline-none w-full"
              >
                {[-3, -2, -1, 0, 1, 2, 3].map((w) => (
                  <option key={w} value={w}>
                    {w > 0 ? `+${w}` : w} — {WEIGHT_LABELS[String(w)]}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                {TIMEFRAME_OPTIONS.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => updateEdgeTimeframe(id, tf.value)}
                    title={tf.title}
                    className={`flex-1 px-1 py-0.5 text-xs rounded font-semibold transition-colors ${
                      timeframe === tf.value
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={timeframe === tf.value ? { backgroundColor: TIMEFRAME_COLORS[tf.value] } : undefined}
                  >
                    {tf.title}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (reverseExists) return;
                  invertEdge(id);
                  setEditing(false);
                }}
                disabled={reverseExists}
                className={`px-1 py-0.5 text-xs rounded border ${
                  reverseExists
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
                title={reverseExists ? 'Reverse connection already exists' : 'Invert arrow direction'}
              >
                ⇄ Invert direction
              </button>
              <button
                onClick={() => deleteEdge(id)}
                className="px-1 py-0.5 text-xs rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-600"
                title="Delete this connection"
              >
                🗑 Delete
              </button>
            </div>
          ) : (
            <div
              onMouseDown={handleMouseDown}
              className={`px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm hover:shadow-md hover:scale-110 transition-all ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ backgroundColor: color }}
              title="Click to edit · Drag to reposition"
            >
              {weight > 0 ? `+${weight}` : weight}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
