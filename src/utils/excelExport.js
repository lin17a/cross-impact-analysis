import XLSX from 'xlsx-js-style';

const THIN_BORDER = {
  top: { style: 'thin', color: { rgb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { rgb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { rgb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { rgb: 'FFD1D5DB' } },
};

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FF374151' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFF3F4F6' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: THIN_BORDER,
};

const ROW_HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FF374151' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: THIN_BORDER,
};

const SUM_STYLE = {
  font: { bold: true, color: { rgb: 'FF1E40AF' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFEFF6FF' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: THIN_BORDER,
};

const DIAGONAL_STYLE = {
  font: { color: { rgb: 'FF9CA3AF' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFF3F4F6' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: THIN_BORDER,
};

const TIMEFRAME_STYLES = {
  short: {
    font: { color: { rgb: 'FF991B1B' }, sz: 11 },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFEE2E2' } },
  },
  middle: {
    font: { color: { rgb: 'FF1E40AF' }, sz: 11 },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFDBEAFE' } },
  },
  long: {
    font: { color: { rgb: 'FF166534' }, sz: 11 },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFDCFCE7' } },
  },
  none: {
    font: { color: { rgb: 'FF374151' }, sz: 11 },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFF9FAFB' } },
  },
};

const ZERO_STYLE = {
  font: { color: { rgb: 'FF9CA3AF' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: THIN_BORDER,
};

const CLASSIFICATION_COLORS = {
  Critical: 'FFFEE2E2',
  Active: 'FFDBEAFE',
  Reactive: 'FFFFFBEB',
  Buffering: 'FFF3F4F6',
};

function cellStyle(timeframe, val) {
  const tfKey = timeframe || 'none';
  const tf = TIMEFRAME_STYLES[tfKey] || TIMEFRAME_STYLES.none;
  const bold = Math.abs(val) >= 3;
  return {
    font: { ...tf.font, bold },
    fill: tf.fill,
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  };
}

export function exportToExcel(matrixData, analysisData) {
  const { factors, matrix, timeframeMatrix } = matrixData;
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
  matrixSheet.push([
    '↓ influences →',
    ...factors.map((f) => f.label),
    'AS',
  ]);
  factors.forEach((factor, i) => {
    const row = [factor.label];
    matrix[i].forEach((val, j) => {
      row.push(i === j ? '' : val || 0);
    });
    row.push(activeSums[i]);
    matrixSheet.push(row);
  });
  matrixSheet.push(['PS', ...passiveSums, activeSums.reduce((s, v) => s + v, 0)]);

  const ws1 = XLSX.utils.aoa_to_sheet(matrixSheet);

  // Apply styles to matrix sheet
  const nFactors = factors.length;
  const nCols = nFactors + 2;

  // Header row styles
  for (let c = 0; c < nCols; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (ws1[ref]) ws1[ref].s = c === 0 ? { ...HEADER_STYLE, alignment: { horizontal: 'left', vertical: 'center' } } : HEADER_STYLE;
  }

  // Data rows
  for (let i = 0; i < nFactors; i++) {
    const r = i + 1;
    // Row header
    const rowHeaderRef = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws1[rowHeaderRef]) ws1[rowHeaderRef].s = ROW_HEADER_STYLE;

    // Data cells
    for (let j = 0; j < nFactors; j++) {
      const ref = XLSX.utils.encode_cell({ r, c: j + 1 });
      if (!ws1[ref]) continue;
      if (i === j) {
        ws1[ref].s = DIAGONAL_STYLE;
      } else if (matrix[i][j] === 0) {
        ws1[ref].s = ZERO_STYLE;
      } else {
        ws1[ref].s = cellStyle(timeframeMatrix[i][j], matrix[i][j]);
      }
    }

    // AS column
    const asRef = XLSX.utils.encode_cell({ r, c: nFactors + 1 });
    if (ws1[asRef]) ws1[asRef].s = SUM_STYLE;
  }

  // PS row
  const psRow = nFactors + 1;
  for (let c = 0; c < nCols; c++) {
    const ref = XLSX.utils.encode_cell({ r: psRow, c });
    if (ws1[ref]) ws1[ref].s = c === 0 ? { ...SUM_STYLE, alignment: { horizontal: 'left', vertical: 'center' } } : SUM_STYLE;
  }

  ws1['!cols'] = [
    { wch: 22 },
    ...factors.map(() => ({ wch: 14 })),
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Influence Matrix');

  // Sheet 2: Factor Analysis
  const analysisSheet = [
    ['Factor', 'Active Sum (AS)', 'Passive Sum (PS)', 'Q = AS × PS', 'P = AS / PS', 'Classification'],
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

  // Style analysis headers
  for (let c = 0; c < 6; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (ws2[ref]) ws2[ref].s = HEADER_STYLE;
  }

  // Style analysis data rows
  analysis.forEach((a, i) => {
    const r = i + 1;
    // Factor name
    const nameRef = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws2[nameRef]) ws2[nameRef].s = { font: { bold: true, sz: 11 }, border: THIN_BORDER };

    // Number cells
    for (let c = 1; c < 5; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws2[ref]) ws2[ref].s = { alignment: { horizontal: 'right' }, border: THIN_BORDER, font: { sz: 11 } };
    }

    // Classification cell
    const clsRef = XLSX.utils.encode_cell({ r, c: 5 });
    if (ws2[clsRef]) {
      ws2[clsRef].s = {
        font: { bold: true, sz: 11 },
        fill: { patternType: 'solid', fgColor: { rgb: CLASSIFICATION_COLORS[a.classification] || 'FFF3F4F6' } },
        border: THIN_BORDER,
      };
    }
  });

  ws2['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Factor Analysis');

  XLSX.writeFile(wb, 'cross-impact-analysis.xlsx');
}
