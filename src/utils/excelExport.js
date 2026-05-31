import * as XLSX from 'xlsx';

export function exportToExcel(matrixData, analysisData) {
  const { factors, matrix } = matrixData;
  const { analysis } = analysisData;
  const wb = XLSX.utils.book_new();

  // Sheet 1: Influence Matrix
  const activeSums = matrix.map((row) =>
    row.reduce((sum, val) => sum + Math.abs(val), 0)
  );
  const passiveSums = factors.map((_, j) =>
    matrix.reduce((sum, row) => sum + Math.abs(row[j]), 0)
  );

  const matrixSheet = [];
  // Header row
  matrixSheet.push([
    '↓ influences →',
    ...factors.map((f) => f.label),
    'Active Sum (AS)',
  ]);
  // Data rows
  factors.forEach((factor, i) => {
    const row = [factor.label];
    matrix[i].forEach((val, j) => {
      row.push(i === j ? '' : val);
    });
    row.push(activeSums[i]);
    matrixSheet.push(row);
  });
  // Passive sum row
  matrixSheet.push(['Passive Sum (PS)', ...passiveSums, '']);

  const ws1 = XLSX.utils.aoa_to_sheet(matrixSheet);
  // Set column widths
  ws1['!cols'] = [
    { wch: 20 },
    ...factors.map(() => ({ wch: 14 })),
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Influence Matrix');

  // Sheet 2: Factor Analysis
  const analysisSheet = [
    [
      'Factor',
      'Active Sum (AS)',
      'Passive Sum (PS)',
      'Q = AS × PS',
      'P = AS / PS',
      'Classification',
    ],
  ];
  analysis.forEach((a) => {
    analysisSheet.push([
      a.label,
      a.activeSum,
      a.passiveSum,
      a.qValue,
      a.pValue === Infinity ? 'N/A' : Number(a.pValue.toFixed(2)),
      a.classification,
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(analysisSheet);
  ws2['!cols'] = [
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Factor Analysis');

  XLSX.writeFile(wb, 'cross-impact-analysis.xlsx');
}
