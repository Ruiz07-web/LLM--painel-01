import type { ReactNode } from 'react';

// Parser mínimo para o markdown que o assistente produz: parágrafos, itens de
// lista (-, *, •), trechos em **negrito** e tabelas em pipe.
function comNegrito(linha: string, chave: string): ReactNode[] {
  return linha.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? (
      <strong key={`${chave}-b${i}`} className="md-strong">
        {parte}
      </strong>
    ) : (
      <span key={`${chave}-t${i}`}>{parte}</span>
    ),
  );
}

const ehLinhaTabela = (l: string) => l.startsWith('|') && l.endsWith('|') && l.length > 2;
// Linha separadora do cabeçalho: | :--- | :---: | ---: |
const ehSeparador = (l: string) => /^\|[\s:|-]+\|$/.test(l) && l.includes('-');

function celulas(linha: string): string[] {
  return linha
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

function Tabela({ linhas, chave }: { linhas: string[]; chave: string }) {
  const corpo = linhas.filter((l) => !ehSeparador(l));
  if (corpo.length === 0) return null;
  const cabecalho = celulas(corpo[0]);
  const dados = corpo.slice(1).map(celulas);

  return (
    <div className="md-tabela-scroll">
      <table className="md-tabela">
        <thead>
          <tr>
            {cabecalho.map((c, i) => (
              <th key={`${chave}-h${i}`}>{comNegrito(c, `${chave}-h${i}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((linha, i) => (
            <tr key={`${chave}-r${i}`}>
              {linha.map((c, j) => (
                <td key={`${chave}-r${i}c${j}`}>{comNegrito(c, `${chave}-r${i}c${j}`)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Markdown({ texto }: { texto: string }) {
  const linhas = texto.split('\n');
  const blocos: ReactNode[] = [];
  let buffer: string[] = [];

  const descarregarTabela = (i: number) => {
    if (buffer.length) {
      blocos.push(<Tabela key={`tb-${i}`} linhas={buffer} chave={`tb-${i}`} />);
      buffer = [];
    }
  };

  linhas.forEach((bruta, i) => {
    const linha = bruta.trim();

    if (ehLinhaTabela(linha)) {
      buffer.push(linha);
      return;
    }
    descarregarTabela(i);

    if (!linha) return;

    const item = linha.match(/^[-*•]\s+(.*)$/);
    if (item) {
      blocos.push(
        <div className="md-li" key={`li-${i}`}>
          <span className="md-bullet">•</span>
          <span>{comNegrito(item[1], `li-${i}`)}</span>
        </div>,
      );
    } else {
      blocos.push(
        <div className="md-p" key={`p-${i}`}>
          {comNegrito(linha, `p-${i}`)}
        </div>,
      );
    }
  });
  descarregarTabela(linhas.length);

  return <>{blocos}</>;
}
