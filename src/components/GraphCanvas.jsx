import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import FactorNode from './FactorNode';
import InfluenceEdge from './InfluenceEdge';

const nodeTypes = { factor: FactorNode };
const edgeTypes = { influence: InfluenceEdge };

export default function GraphCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}) {
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        connectionMode="loose"
        className="bg-gray-50"
        defaultEdgeOptions={{ type: 'influence' }}
      >
        <Controls />
        <MiniMap
          nodeColor="#e2e8f0"
          maskColor="rgba(0,0,0,0.08)"
          className="rounded-lg border border-gray-200"
        />
        <Background variant="dots" gap={20} size={1} color="#d1d5db" />
      </ReactFlow>
    </div>
  );
}
