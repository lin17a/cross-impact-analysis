export function buildMatrix(nodes, edges) {
  const factors = nodes.map((n) => ({ id: n.id, label: n.data.label }));
  const n = factors.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const timeframeMatrix = Array.from({ length: n }, () => Array(n).fill(null));

  edges.forEach((edge) => {
    const sourceIdx = factors.findIndex((f) => f.id === edge.source);
    const targetIdx = factors.findIndex((f) => f.id === edge.target);
    if (sourceIdx !== -1 && targetIdx !== -1) {
      matrix[sourceIdx][targetIdx] = edge.data?.weight || 0;
      timeframeMatrix[sourceIdx][targetIdx] = edge.data?.timeframe || 'short';
    }
  });

  return { factors, matrix, timeframeMatrix };
}

export function calculateFactorAnalysis({ factors, matrix }) {
  const n = factors.length;

  if (n === 0) return { analysis: [], meanAS: 0, meanPS: 0 };

  const analysis = factors.map((factor, i) => {
    const activeSum = matrix[i].reduce((sum, val) => sum + Math.abs(val), 0);
    const passiveSum = matrix.reduce((sum, row) => sum + Math.abs(row[i]), 0);

    return {
      ...factor,
      activeSum,
      passiveSum,
      qValue: activeSum * passiveSum,
      pValue: passiveSum === 0 ? Infinity : activeSum / passiveSum,
    };
  });

  const meanAS = analysis.reduce((sum, a) => sum + a.activeSum, 0) / n;
  const meanPS = analysis.reduce((sum, a) => sum + a.passiveSum, 0) / n;

  analysis.forEach((a) => {
    if (a.activeSum >= meanAS && a.passiveSum >= meanPS)
      a.classification = 'Critical';
    else if (a.activeSum >= meanAS) a.classification = 'Active';
    else if (a.passiveSum >= meanPS) a.classification = 'Reactive';
    else a.classification = 'Buffering';
  });

  return { analysis, meanAS, meanPS };
}
