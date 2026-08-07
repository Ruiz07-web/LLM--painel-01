import { useMemo, useState } from 'react';
import type { Visualization } from '../types';
import { FONTE } from '../lib/api';

export function TableCard({ vis }: { vis: Visualization }) {
  const colunas = useMemo(() => {
    if (vis.columns?.length) return vis.columns;
    const primeira = vis.data[0] ?? {};
    return Object.keys(primeira).map((k) => ({ key: k, label: k }));
  }, [vis]);

  const [ordem, setOrdem] = useState<{ key: string; asc: boolean } | null>(null);

  const linhas = useMemo(() => {
    if (!ordem) return vis.data;
    const copia = [...vis.data];
    copia.sort((a, b) => {
      const va = a[ordem.key];
      const vb = b[ordem.key];
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return ordem.asc ? va - vb : vb - va;
      return ordem.asc
        ? String(va).localeCompare(String(vb), 'pt-BR')
        : String(vb).localeCompare(String(va), 'pt-BR');
    });
    return copia;
  }, [vis.data, ordem]);

  const ordenar = (key: string) =>
    setOrdem((prev) => (prev && prev.key === key ? { key, asc: !prev.asc } : { key, asc: true }));

  return (
    <div className="card card-tabela">
      <div className="card-titulo card-titulo-tabela">{vis.title}</div>
      <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              {colunas.map((c) => (
                <th key={c.key} onClick={() => ordenar(c.key)}>
                  {c.label}
                  {ordem?.key === c.key ? (ordem.asc ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => (
              <tr key={i}>
                {colunas.map((c) => (
                  <td key={c.key}>{linha[c.key] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-fonte">{vis.source ?? FONTE}</div>
    </div>
  );
}
