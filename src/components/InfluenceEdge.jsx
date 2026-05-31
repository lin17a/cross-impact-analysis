import { useState, useContext, useEffect, useRef } from 'react';
import { getBezierPath, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import { AppContext, getTimeframeColor } from '../App';
import { translations } from '../i18n';

const HANDLE_OPTIONS = ['top', 'bottom', 'left', 'right'];

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
  sourceHandleId,
  targetHandleId,
  data,
  markerEnd,
}) {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0, moved: false });
  const popupRef = useRef(null);
  const { edges, lang, updateEdgeWeight, updateEdgeDirection, updateEdgeTimeframe, updateEdgeLabelOffset, updateEdgeHandles, invertEdge, deleteEdge } = useContext(AppContext);
  const { getZoom } = useReactFlow();

  const t = translations[lang].edge;

  const weight = data?.weight ?? 1;
  const direction = data?.direction ?? null;
  const timeframe = data?.timeframe ?? null;
  const offsetX = data?.labelOffsetX ?? 0;
  const offsetY = data?.labelOffsetY ?? 0;
  const color = getTimeframeColor(timeframe);
  const strokeWidth = Math.max(1.5, weight * 1.5);

  // Check if reverse edge exists (for graying out invert button)
  const reverseExists = edges.some((e) => e.source === target && e.target === source);

  // Build badge text
  let badgeText = String(weight);
  if (direction === '+') badgeText = `+${weight}`;
  else if (direction === '-') badgeText = `−${weight}`;

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

  const handleLabels = { top: t.top, bottom: t.bottom, left: t.left, right: t.right };

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
              className="bg-white rounded-lg shadow-lg p-2.5 border border-gray-200 flex flex-col gap-2 min-w-[160px]"
            >
              {/* Strength */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">{t.strength}</div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((w) => (
                    <button
                      key={w}
                      onClick={() => updateEdgeWeight(id, w)}
                      className={`flex-1 px-1 py-0.5 text-xs rounded font-semibold transition-colors ${
                        weight === w
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {w} — {t[`strength${w}`]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Direction */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">{t.direction}</div>
                <div className="flex gap-1">
                  {[
                    { value: null, label: t.dirNone },
                    { value: '+', label: t.dirSame },
                    { value: '-', label: t.dirOpposite },
                  ].map((d) => (
                    <button
                      key={String(d.value)}
                      onClick={() => updateEdgeDirection(id, d.value)}
                      className={`flex-1 px-1 py-0.5 text-xs rounded font-semibold transition-colors ${
                        direction === d.value
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Timeframe */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">{t.timeframe}</div>
                <div className="flex gap-1">
                  {[
                    { value: null, label: t.tfNone, color: null },
                    { value: 'short', label: t.tfShort, color: '#ef4444' },
                    { value: 'middle', label: t.tfMiddle, color: '#0ea5e9' },
                    { value: 'long', label: t.tfLong, color: '#22c55e' },
                  ].map((tf) => (
                    <button
                      key={String(tf.value)}
                      onClick={() => updateEdgeTimeframe(id, tf.value)}
                      className={`flex-1 px-1 py-0.5 text-xs rounded font-semibold transition-colors ${
                        timeframe === tf.value
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={timeframe === tf.value ? { backgroundColor: tf.color || '#6b7280' } : undefined}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Dock points */}
              <div>
                <div className="text-[10px] font-medium text-gray-500 mb-1">{t.dockPoints}</div>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-gray-500">{t.from}</label>
                  <select
                    value={sourceHandleId || 'bottom'}
                    onChange={(e) => updateEdgeHandles(id, e.target.value, targetHandleId || 'top')}
                    className="flex-1 px-1 py-0.5 text-xs rounded border border-gray-300 bg-white outline-none"
                  >
                    {HANDLE_OPTIONS.map((h) => (
                      <option key={h} value={h}>{handleLabels[h]}</option>
                    ))}
                  </select>
                  <label className="text-xs text-gray-500">{t.to}</label>
                  <select
                    value={targetHandleId || 'top'}
                    onChange={(e) => updateEdgeHandles(id, sourceHandleId || 'bottom', e.target.value)}
                    className="flex-1 px-1 py-0.5 text-xs rounded border border-gray-300 bg-white outline-none"
                  >
                    {HANDLE_OPTIONS.map((h) => (
                      <option key={h} value={h}>{handleLabels[h]}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-1 pt-1 border-t border-gray-100">
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
                  title={reverseExists ? t.reverseExists : ''}
                >
                  {t.invert}
                </button>
                <button
                  onClick={() => deleteEdge(id)}
                  className="px-1 py-0.5 text-xs rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-600"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          ) : (
            <div
              onMouseDown={handleMouseDown}
              className={`px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm hover:shadow-md hover:scale-110 transition-all ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ backgroundColor: color }}
              title={t.clickToEdit}
            >
              {badgeText}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
