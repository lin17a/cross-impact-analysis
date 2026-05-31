import { useState, useCallback, createContext } from 'react';
import { applyNodeChanges, applyEdgeChanges, MarkerType, ReactFlowProvider } from 'reactflow';
import GraphCanvas from './components/GraphCanvas';
import MatrixView from './components/MatrixView';
import QuadrantChart from './components/QuadrantChart';
import { buildMatrix, calculateFactorAnalysis } from './utils/matrixUtils';
import { exportToExcel } from './utils/excelExport';
import { translations } from './i18n';

export const AppContext = createContext();

export function getTimeframeColor(timeframe) {
  switch (timeframe) {
    case 'short': return '#ef4444';
    case 'middle': return '#0ea5e9';
    case 'long': return '#22c55e';
    default: return '#6b7280';
  }
}

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeTab, setActiveTab] = useState('canvas');
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState('en');

  const t = translations[lang];

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback((connection) => {
    if (connection.source === connection.target) return;
    setEdges((eds) => {
      const exists = eds.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (exists) {
        setTimeout(() => showToast(translations[lang].app.connectionExists), 0);
        return eds;
      }
      const newEdge = {
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'influence',
        data: { weight: 1, direction: null, timeframe: null },
        markerEnd: { type: MarkerType.ArrowClosed, color: getTimeframeColor(null) },
      };
      return [...eds, newEdge];
    });
  }, [showToast, lang]);

  const addNode = useCallback(() => {
    setNodes((nds) => {
      const maxId = nds.reduce((max, n) => {
        const num = parseInt(n.id.replace('factor-', ''));
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newId = maxId + 1;
      const label = `${translations[lang].app.newFactor} ${newId}`;
      return [
        ...nds,
        {
          id: `factor-${newId}`,
          type: 'factor',
          position: { x: 150 + Math.random() * 400, y: 100 + Math.random() * 300 },
          data: { label },
        },
      ];
    });
  }, [lang]);

  const updateNodeLabel = useCallback((nodeId, newLabel) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
      )
    );
  }, []);

  const updateEdgeWeight = useCallback((edgeId, newWeight) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              data: { ...e.data, weight: newWeight },
              markerEnd: { type: MarkerType.ArrowClosed, color: getTimeframeColor(e.data?.timeframe ?? null) },
            }
          : e
      )
    );
  }, []);

  const updateEdgeTimeframe = useCallback((edgeId, newTimeframe) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              data: { ...e.data, timeframe: newTimeframe },
              markerEnd: { type: MarkerType.ArrowClosed, color: getTimeframeColor(newTimeframe) },
            }
          : e
      )
    );
  }, []);

  const updateEdgeDirection = useCallback((edgeId, newDirection) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? { ...e, data: { ...e.data, direction: newDirection } }
          : e
      )
    );
  }, []);

  const updateEdgeHandles = useCallback((edgeId, sourceHandle, targetHandle) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? { ...e, sourceHandle, targetHandle }
          : e
      )
    );
  }, []);

  const updateEdgeLabelOffset = useCallback((edgeId, offsetX, offsetY) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? { ...e, data: { ...e.data, labelOffsetX: offsetX, labelOffsetY: offsetY } }
          : e
      )
    );
  }, []);

  const invertEdge = useCallback((edgeId) => {
    setEdges((eds) => {
      const edge = eds.find((e) => e.id === edgeId);
      if (!edge) return eds;
      const newId = `e-${edge.target}-${edge.source}`;
      if (eds.some((e) => e.id === newId)) return eds;
      return eds.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              id: newId,
              source: e.target,
              target: e.source,
              sourceHandle: e.targetHandle,
              targetHandle: e.sourceHandle,
            }
          : e
      );
    });
  }, []);

  const deleteEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const clearAll = useCallback(() => {
    if (!confirm(t.app.clearConfirm)) return;
    setNodes([]);
    setEdges([]);
  }, []);

  const saveToLocalStorage = useCallback(() => {
    const data = JSON.stringify({ nodes, edges });
    localStorage.setItem('cross-impact-analysis', data);
    setShowMenu(false);
  }, [nodes, edges]);

  const loadFromLocalStorage = useCallback(() => {
    const data = localStorage.getItem('cross-impact-analysis');
    if (data) {
      const parsed = JSON.parse(data);
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
    }
    setShowMenu(false);
  }, []);

  const exportJSON = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cross-impact-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  }, [nodes, edges]);

  const importJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          setNodes(parsed.nodes || []);
          setEdges(parsed.edges || []);
        } catch {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setShowMenu(false);
  }, []);

  const matrixData = buildMatrix(nodes, edges);
  const analysisData = calculateFactorAnalysis(matrixData);

  const handleExportExcel = useCallback(() => {
    exportToExcel(matrixData, analysisData);
  }, [matrixData, analysisData]);

  const contextValue = { edges, lang, updateEdgeWeight, updateEdgeDirection, updateEdgeTimeframe, updateEdgeLabelOffset, updateEdgeHandles, updateNodeLabel, deleteNode, deleteEdge, invertEdge };

  const tabs = [
    { id: 'canvas', label: t.app.tabCanvas },
    { id: 'matrix', label: t.app.tabMatrix },
    { id: 'quadrant', label: t.app.tabQuadrant },
  ];

  return (
    <AppContext.Provider value={contextValue}>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Toast notification */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 bg-red-600 text-white text-sm rounded-lg shadow-lg animate-fade-in">
            {toast}
          </div>
        )}
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-gray-800">
              {t.app.title}
            </h1>
            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'canvas' && (
              <button
                onClick={addNode}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t.app.addFactor}
              </button>
            )}
            <button
              onClick={handleExportExcel}
              disabled={nodes.length === 0}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.app.exportExcel}
            </button>
            <button
              onClick={() => setLang((l) => (l === 'en' ? 'de' : 'en'))}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              {lang === 'en' ? 'DE' : 'EN'}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                {t.app.more}
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50 min-w-[180px]">
                    <button
                      onClick={saveToLocalStorage}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t.app.saveBrowser}
                    </button>
                    <button
                      onClick={loadFromLocalStorage}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t.app.loadBrowser}
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={exportJSON}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t.app.exportJSON}
                    </button>
                    <button
                      onClick={importJSON}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t.app.importJSON}
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => {
                        clearAll();
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      {t.app.clearAll}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'canvas' && (
            <ReactFlowProvider>
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
              />
            </ReactFlowProvider>
          )}
          {activeTab === 'matrix' && <MatrixView matrixData={matrixData} lang={lang} />}
          {activeTab === 'quadrant' && (
            <QuadrantChart analysisData={analysisData} lang={lang} />
          )}
        </main>
      </div>
    </AppContext.Provider>
  );
}
