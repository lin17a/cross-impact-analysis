import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { translations } from '../i18n';

const COLORS = {
  Active: '#3b82f6',
  Reactive: '#f59e0b',
  Critical: '#ef4444',
  Buffering: '#6b7280',
};

function CustomTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const { name, x, y, classification } = payload[0].payload;
  return (
    <div className="bg-white shadow-lg border border-gray-200 rounded-lg p-3 text-sm">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="text-gray-600">{t.activeSum}: {x}</p>
      <p className="text-gray-600">{t.passiveSum}: {y}</p>
      <p className="mt-1">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: COLORS[classification] }}
        >
          {t[classification]}
        </span>
      </p>
    </div>
  );
}

export default function QuadrantChart({ analysisData, lang }) {
  const t = translations[lang].quadrant;
  const { analysis, meanAS, meanPS } = analysisData;

  if (analysis.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">{t.noData}</p>
          <p className="text-sm">
            {t.noDataDesc}
          </p>
        </div>
      </div>
    );
  }

  const chartData = analysis.map((a) => ({
    x: a.activeSum,
    y: a.passiveSum,
    name: a.label,
    classification: a.classification,
  }));

  const maxVal = Math.max(
    ...analysis.map((a) => Math.max(a.activeSum, a.passiveSum)),
    1
  );
  const domainMax = Math.ceil(maxVal * 1.3) || 5;

  return (
    <div className="p-6 overflow-auto h-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {t.title}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {t.description}
      </p>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
        <ResponsiveContainer width="100%" height={480}>
          <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, domainMax]}
              label={{
                value: t.xAxisLabel,
                position: 'bottom',
                offset: 15,
                style: { fill: '#6b7280', fontSize: 13 },
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, domainMax]}
              label={{
                value: t.yAxisLabel,
                angle: -90,
                position: 'left',
                offset: 15,
                style: { fill: '#6b7280', fontSize: 13 },
              }}
              tick={{ fontSize: 12 }}
            />
            <ReferenceLine
              x={meanAS}
              stroke="#94a3b8"
              strokeDasharray="8 4"
              strokeWidth={1.5}
              label={{
                value: `${t.meanAS}: ${meanAS.toFixed(1)}`,
                position: 'top',
                style: { fill: '#64748b', fontSize: 11 },
              }}
            />
            <ReferenceLine
              y={meanPS}
              stroke="#94a3b8"
              strokeDasharray="8 4"
              strokeWidth={1.5}
              label={{
                value: `${t.meanPS}: ${meanPS.toFixed(1)}`,
                position: 'right',
                style: { fill: '#64748b', fontSize: 11 },
              }}
            />
            <Tooltip content={<CustomTooltip t={t} />} />
            <Scatter data={chartData}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={COLORS[entry.classification]}
                  stroke={COLORS[entry.classification]}
                  strokeWidth={2}
                />
              ))}
              <LabelList
                dataKey="name"
                position="top"
                offset={10}
                style={{ fontSize: 11, fill: '#374151' }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Object.entries(COLORS).map(([cls, color]) => (
          <div
            key={cls}
            className="flex items-start gap-2 p-2 rounded-lg bg-white border border-gray-100"
          >
            <div
              className="w-3 h-3 rounded-full mt-0.5 shrink-0"
              style={{ backgroundColor: color }}
            />
            <div>
              <span className="text-sm font-medium text-gray-800">{t[cls]}</span>
              <p className="text-xs text-gray-500">{t[`${cls}Desc`]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                {t.factor}
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">
                {t.activeSum}
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">
                {t.passiveSum}
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">
                Q = AS × PS
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">
                P = AS / PS
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                {t.role}
              </th>
            </tr>
          </thead>
          <tbody>
            {analysis.map((a, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  {a.label}
                </td>
                <td className="text-right px-4 py-3 tabular-nums">
                  {a.activeSum}
                </td>
                <td className="text-right px-4 py-3 tabular-nums">
                  {a.passiveSum}
                </td>
                <td className="text-right px-4 py-3 tabular-nums">
                  {a.qValue}
                </td>
                <td className="text-right px-4 py-3 tabular-nums">
                  {a.pValue === Infinity ? '∞' : a.pValue.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: COLORS[a.classification] }}
                  >
                    {t[a.classification]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
