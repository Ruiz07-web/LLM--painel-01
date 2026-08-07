import { useRef, useState } from 'react';
import type { ElementType } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Serie, Visualization } from '../types';
import { CORES, FONTE } from '../lib/api';
import { baixarSvgComoPng, nomeArquivo } from '../lib/download';

function corDaSerie(s: Serie, i: number): string {
  if (s.color) return s.color;
  const k = s.key.toLowerCase();
  if (k.includes('consum')) return CORES.consumado;
  if (k.includes('tent')) return CORES.tentado;
  return CORES.extra[i % CORES.extra.length];
}

const IconeAmpliar = () => (
  <svg viewBox="0 0 16 16" className="ico">
    <polyline points="6,2 2,2 2,6" />
    <polyline points="10,14 14,14 14,10" />
    <line x1="2" y1="2" x2="6.5" y2="6.5" />
    <line x1="14" y1="14" x2="9.5" y2="9.5" />
  </svg>
);

const IconeBaixar = () => (
  <svg viewBox="0 0 16 16" className="ico">
    <line x1="8" y1="2" x2="8" y2="10" />
    <polyline points="4.5,7 8,10.5 11.5,7" />
    <line x1="3" y1="13.5" x2="13" y2="13.5" />
  </svg>
);

export function ChartCard({ vis }: { vis: Visualization }) {
  const series = vis.series ?? [];
  const [ocultas, setOcultas] = useState<string[]>([]);
  const [ampliado, setAmpliado] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const alternar = (key: string) =>
    setOcultas((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const baixar = () => {
    const svg = box.current?.querySelector('svg.recharts-surface') as SVGSVGElement | null;
    baixarSvgComoPng(svg, nomeArquivo(vis.title));
  };

  const xKey = vis.xAxis?.key ?? 'x';
  const visiveis = series.filter((s) => !ocultas.includes(s.key));
  // ElementType evita o tipo-união entre BarChart e LineChart, que o JSX rejeita.
  const Grafico: ElementType = vis.type === 'bar' ? BarChart : LineChart;

  return (
    <div className={ampliado ? 'card card-grafico card-amplo' : 'card card-grafico'}>
      <div className="card-head">
        <div className="card-titulos">
          <div className="card-titulo">{vis.title}</div>
          {vis.subtitle && <div className="card-sub">{vis.subtitle}</div>}
        </div>
        <div className="card-acoes">
          <button
            className="btn-ico"
            title={ampliado ? 'Reduzir' : 'Ampliar'}
            onClick={() => setAmpliado((v) => !v)}
          >
            <IconeAmpliar />
          </button>
          <button className="btn-ico" title="Baixar PNG" onClick={baixar}>
            <IconeBaixar />
          </button>
        </div>
      </div>

      <div className="legenda">
        {series.map((s, i) => {
          const off = ocultas.includes(s.key);
          return (
            <button
              key={s.key}
              className={off ? 'chip-legenda off' : 'chip-legenda'}
              onClick={() => alternar(s.key)}
            >
              <span className="chip-cor" style={{ background: off ? '#D5D8DD' : corDaSerie(s, i) }} />
              {s.name}
            </button>
          );
        })}
      </div>

      <div className="grafico" ref={box}>
        <ResponsiveContainer width="100%" height={ampliado ? 460 : 300}>
          <Grafico data={vis.data} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid stroke="#EEEEEE" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#595959', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#D5D8DD' }}
              label={
                vis.xAxis
                  ? { value: vis.xAxis.label, position: 'insideBottom' as const, offset: -14, fill: '#8A8F98', fontSize: 12 }
                  : undefined
              }
            />
            <YAxis
              tick={{ fill: '#8A8F98', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={44}
              label={
                vis.yAxis
                  ? { value: vis.yAxis.label, angle: -90, position: 'insideLeft' as const, fill: '#8A8F98', fontSize: 12 }
                  : undefined
              }
            />
            <Tooltip
              contentStyle={{
                background: '#1F3864',
                border: 'none',
                borderRadius: 7,
                color: '#FFFFFF',
                fontSize: 12.5,
              }}
              labelStyle={{ color: '#FFFFFF', opacity: 0.7, fontWeight: 700, fontSize: 11.5 }}
              itemStyle={{ color: '#FFFFFF' }}
              cursor={{ stroke: '#1F3864', strokeDasharray: '3 3', opacity: 0.35 }}
            />
            {visiveis.map((s, i) =>
              vis.type === 'bar' ? (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={corDaSerie(s, i)}
                  radius={[2, 2, 0, 0] as [number, number, number, number]}
                />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={corDaSerie(s, i)}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#FFFFFF', stroke: corDaSerie(s, i), strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              ),
            )}
          </Grafico>
        </ResponsiveContainer>
      </div>

      <div className="card-fonte">{vis.source ?? FONTE}</div>
    </div>
  );
}
