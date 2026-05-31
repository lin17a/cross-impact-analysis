function getCellClasses(val, isDiagonal, timeframe) {
  if (isDiagonal) return 'bg-gray-100 text-gray-400';
  if (val === 0 || !timeframe) return 'bg-gray-50 text-gray-400';

  const absVal = Math.abs(val);

  switch (timeframe) {
    case 'short':
      if (absVal >= 3) return 'bg-blue-200 text-blue-900 font-semibold';
      if (absVal === 2) return 'bg-blue-100 text-blue-800';
      return 'bg-blue-50 text-blue-700';
    case 'middle':
      if (absVal >= 3) return 'bg-amber-200 text-amber-900 font-semibold';
      if (absVal === 2) return 'bg-amber-100 text-amber-800';
      return 'bg-amber-50 text-amber-700';
    case 'long':
      if (absVal >= 3) return 'bg-violet-200 text-violet-900 font-semibold';
      if (absVal === 2) return 'bg-violet-100 text-violet-800';
      return 'bg-violet-50 text-violet-700';
    default:
      return 'bg-blue-50 text-blue-700';
  }
}

export default function MatrixView({ matrixData }) {
  const { factors, matrix, timeframeMatrix } = matrixData;

  if (factors.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">No factors yet</p>
          <p className="text-sm">
            Add factors and connect them on the Canvas tab to generate the
            influence matrix.
          </p>
        </div>
      </div>
    );
  }

  const activeSums = matrix.map((row) =>
    row.reduce((sum, val) => sum + Math.abs(val), 0)
  );
  const passiveSums = factors.map((_, j) =>
    matrix.reduce((sum, row) => sum + Math.abs(row[j]), 0)
  );

  return (
    <div className="p-6 overflow-auto h-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        Influence Matrix
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Rows show outgoing influence (how much a factor affects others). Columns
        show incoming influence (how much a factor is affected). Values range
        from −3 (strong negative) to +3 (strong positive).
      </p>

      <div className="overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="border-collapse text-sm min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 border border-gray-200 text-left text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[140px]">
                ↓ influences →
              </th>
              {factors.map((f) => (
                <th
                  key={f.id}
                  className="px-3 py-2 border border-gray-200 text-center font-semibold text-gray-700 min-w-[100px]"
                >
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 border border-gray-200 text-center font-semibold text-blue-700 bg-blue-50 min-w-[80px]">
                AS
              </th>
            </tr>
          </thead>
          <tbody>
            {factors.map((factor, i) => (
              <tr key={factor.id} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 border border-gray-200 font-semibold text-gray-700 sticky left-0 bg-white z-10">
                  {factor.label}
                </td>
                {matrix[i].map((val, j) => (
                  <td
                    key={j}
                    className={`px-3 py-2 border border-gray-200 text-center tabular-nums ${getCellClasses(val, i === j, timeframeMatrix[i][j])}`}
                  >
                    {i === j ? '—' : val !== 0 ? (val > 0 ? `+${val}` : val) : '0'}
                  </td>
                ))}
                <td className="px-3 py-2 border border-gray-200 text-center font-bold text-blue-700 bg-blue-50 tabular-nums">
                  {activeSums[i]}
                </td>
              </tr>
            ))}
            <tr className="bg-blue-50">
              <td className="px-3 py-2 border border-gray-200 font-semibold text-blue-700 sticky left-0 bg-blue-50 z-10">
                PS
              </td>
              {passiveSums.map((ps, j) => (
                <td
                  key={j}
                  className="px-3 py-2 border border-gray-200 text-center font-bold text-blue-700 tabular-nums"
                >
                  {ps}
                </td>
              ))}
              <td className="px-3 py-2 border border-gray-200 text-center font-bold text-blue-900 bg-blue-100 tabular-nums">
                {activeSums.reduce((s, v) => s + v, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-6 text-xs text-gray-500">
        <span>
          <strong className="text-blue-700">AS</strong> = Active Sum (total
          outgoing influence, absolute values)
        </span>
        <span>
          <strong className="text-blue-700">PS</strong> = Passive Sum (total
          incoming influence, absolute values)
        </span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-blue-200" /> Short term
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-amber-200" /> Middle term
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-violet-200" /> Long term
        </span>
      </div>
    </div>
  );
}
