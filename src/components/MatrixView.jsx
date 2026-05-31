import { translations } from '../i18n';

function getCellClasses(val, isDiagonal, timeframe) {
  if (isDiagonal) return 'bg-gray-100 text-gray-400';
  if (val === 0 || timeframe === undefined) return 'bg-gray-50 text-gray-400';

  const absVal = Math.abs(val);

  switch (timeframe) {
    case 'short':
      if (absVal >= 3) return 'bg-red-200 text-red-900 font-semibold';
      if (absVal === 2) return 'bg-red-100 text-red-800';
      return 'bg-red-50 text-red-700';
    case 'middle':
      if (absVal >= 3) return 'bg-sky-200 text-sky-900 font-semibold';
      if (absVal === 2) return 'bg-sky-100 text-sky-800';
      return 'bg-sky-50 text-sky-700';
    case 'long':
      if (absVal >= 3) return 'bg-green-200 text-green-900 font-semibold';
      if (absVal === 2) return 'bg-green-100 text-green-800';
      return 'bg-green-50 text-green-700';
    default:
      if (absVal >= 3) return 'bg-gray-200 text-gray-900 font-semibold';
      if (absVal === 2) return 'bg-gray-100 text-gray-800';
      return 'bg-gray-50 text-gray-700';
  }
}

export default function MatrixView({ matrixData, lang }) {
  const t = translations[lang].matrix;
  const { factors, matrix, timeframeMatrix } = matrixData;

  if (factors.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">{t.noFactors}</p>
          <p className="text-sm">
            {t.noFactorsDesc}
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
        {t.title}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {t.description}
      </p>

      <div className="overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="border-collapse text-sm min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 border border-gray-200 text-left text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[140px]">
                {t.influences}
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
                {t.as}
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
                    {i === j ? '—' : val !== 0 ? val : '0'}
                  </td>
                ))}
                <td className="px-3 py-2 border border-gray-200 text-center font-bold text-blue-700 bg-blue-50 tabular-nums">
                  {activeSums[i]}
                </td>
              </tr>
            ))}
            <tr className="bg-blue-50">
              <td className="px-3 py-2 border border-gray-200 font-semibold text-blue-700 sticky left-0 bg-blue-50 z-10">
                {t.ps}
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
          <strong className="text-blue-700">{t.as}</strong> = {t.asDesc}
        </span>
        <span>
          <strong className="text-blue-700">{t.ps}</strong> = {t.psDesc}
        </span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-200" /> {t.shortTerm}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-sky-200" /> {t.middleTerm}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-200" /> {t.longTerm}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-gray-200" /> {t.noTimeframe}
        </span>
      </div>
    </div>
  );
}
