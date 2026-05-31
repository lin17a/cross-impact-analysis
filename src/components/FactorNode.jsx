import { useState, useContext } from 'react';
import { Handle, Position } from 'reactflow';
import { AppContext } from '../App';

export default function FactorNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const { updateNodeLabel, deleteNode } = useContext(AppContext);

  const handleDoubleClick = () => {
    setEditing(true);
    setEditValue(data.label);
  };

  const handleSubmit = () => {
    setEditing(false);
    if (editValue.trim()) {
      updateNodeLabel(id, editValue.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div
      className={`relative px-4 py-3 bg-white rounded-lg border-2 shadow-sm min-w-[120px] text-center transition-all ${
        selected
          ? 'border-blue-500 shadow-md'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Left} id="left" />

      {editing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          autoFocus
          className="w-full text-center text-sm font-medium bg-transparent border-b-2 border-blue-500 outline-none"
        />
      ) : (
        <div className="text-sm font-medium text-gray-800 select-none">
          {data.label}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />

      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
        >
          ×
        </button>
      )}
    </div>
  );
}
