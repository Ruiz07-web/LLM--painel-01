import { useEffect, useRef, useState } from 'react';
import type { Conversa, Message } from './types';
import { perguntar } from './lib/api';
import { Markdown } from './lib/markdown';
import { ChartCard } from './components/ChartCard';
import { TableCard } from './components/TableCard';

const SUGESTOES = [
  'Evolução anual de 2015 a 2025',
  'Ranking de municípios por taxa por 100 mil mulheres em 2025',
  'Violência doméstica contra a mulher em Campo Grande em 2024',
  'Medidas protetivas concedidas em 2024',
  'Onde buscar ajuda em Dourados',
];

function novoId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [sidebar, setSidebar] = useState(true);
  const [mensagens, setMensagens] = useState<Message[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [texto, setTexto] = useState('');
  const [sessionId, setSessionId] = useState(() => `iface-${Date.now()}`);
  const [historico, setHistorico] = useState<Conversa[]>([]);
  const ultimaPergunta = useRef<string>('');
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  async function enviar(pergunta: string) {
    const limpa = pergunta.trim();
    if (!limpa || ocupado) return;

    ultimaPergunta.current = limpa;
    setTexto('');
    setOcupado(true);

    const idCarregando = novoId();
    setMensagens((prev) => [
      ...prev,
      { id: novoId(), role: 'user', text: limpa, state: 'done' },
      { id: idCarregando, role: 'assistant', text: '', state: 'loading' },
    ]);

    if (historico.length === 0 || historico[0].title !== limpa) {
      setHistorico((prev) => [{ id: novoId(), title: limpa }, ...prev].slice(0, 12));
    }

    try {
      const r = await perguntar(limpa, sessionId);
      setMensagens((prev) =>
        prev.map((m) =>
          m.id === idCarregando
            ? { ...m, text: r.texto, visualization: r.visualization, state: 'done' as const }
            : m,
        ),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha desconhecida.';
      setMensagens((prev) =>
        prev.map((m) =>
          m.id === idCarregando
            ? { ...m, text: `Não consegui consultar a base. ${msg}`, state: 'error' as const }
            : m,
        ),
      );
    } finally {
      setOcupado(false);
    }
  }

  function tentarNovamente() {
    setMensagens((prev) => {
      const i = prev.map((m) => m.state).lastIndexOf('error');
      return i >= 0 ? prev.slice(0, i - 1) : prev;
    });
    void enviar(ultimaPergunta.current);
  }

  function novaConversa() {
    setMensagens([]);
    setSessionId(`iface-${Date.now()}`);
  }

  const vazio = mensagens.length === 0;

  return (
    <div className="app">
      {sidebar && (
        <aside className="sidebar">
          <div className="marca">
            <div className="marca-quadro" />
            <div className="marca-txt">
              <div className="marca-nome">MULHERES EM EVIDÊNCIA</div>
              <div className="marca-sub">OCMS · Mato Grosso do Sul</div>
            </div>
          </div>
          <div className="sidebar-acao">
            <button className="btn-nova" onClick={novaConversa}>
              <svg viewBox="0 0 16 16" className="ico">
                <line x1="8" y1="3" x2="8" y2="13" />
                <line x1="3" y1="8" x2="13" y2="8" />
              </svg>
              Nova conversa
            </button>
          </div>
          <div className="sidebar-rotulo">HISTÓRICO</div>
          <nav className="sidebar-lista">
            {historico.map((h) => (
              <div className="sidebar-item" key={h.id} title={h.title}>
                {h.title}
              </div>
            ))}
          </nav>
          <div className="sidebar-rodape">
            Dados: Painel Mulheres em Evidência
            <br />
            Atualização: setembro de 2026
          </div>
        </aside>
      )}

      <main className="main">
        <header className="topo">
          <button className="btn-ico" onClick={() => setSidebar((v) => !v)} title="Menu">
            <svg viewBox="0 0 16 16" className="ico">
              <line x1="2.5" y1="4" x2="13.5" y2="4" />
              <line x1="2.5" y1="8" x2="13.5" y2="8" />
              <line x1="2.5" y1="12" x2="13.5" y2="12" />
            </svg>
          </button>
          <div className="topo-txt">
            <h1>Assistende de Dados - Violência contra à Mulher</h1>
            <div className="topo-sub">Consulta em linguagem natural sobre a base do Observatório</div>
          </div>
          <div className="flex1" />
          <div className="pill">
            <span className="pill-dot" />
            Supabase conectado
          </div>
        </header>

        <div className="rolagem">
          <div className="coluna">
            {vazio && (
              <div className="vazio">
                <div className="vazio-quadro" />
                <h2>Pergunte aos dados</h2>
                <p>
                  Perguntas em português são traduzidas em consultas SQL na base do Observatório.
                  Quando o resultado tem forma de série, o gráfico aparece junto da resposta.
                </p>
              </div>
            )}

            {mensagens.map((m) => {
              if (m.role === 'user') {
                return (
                  <div className="linha-dir" key={m.id}>
                    <div className="bolha-user">{m.text}</div>
                  </div>
                );
              }
              if (m.state === 'loading') {
                return (
                  <div className="linha-esq" key={m.id}>
                    <div className="bolha-load">
                      <span className="spinner" />
                      Processando consulta…
                    </div>
                  </div>
                );
              }
              if (m.state === 'error') {
                return (
                  <div className="col-esq" key={m.id}>
                    <div className="bolha-erro">{m.text}</div>
                    <button className="btn-retry" onClick={tentarNovamente}>
                      Tentar novamente
                    </button>
                  </div>
                );
              }
              return (
                <div className="col-esq" key={m.id}>
                  <div className="bolha-bot">
                    <Markdown texto={m.text} />
                  </div>
                  {m.visualization &&
                    (m.visualization.type === 'table' ? (
                      <TableCard vis={m.visualization} />
                    ) : (
                      <ChartCard vis={m.visualization} />
                    ))}
                </div>
              );
            })}
            <div ref={fim} className="fim" />
          </div>
        </div>

        <div className="composer-area">
          <div className="coluna">
            <div className="chips">
              {SUGESTOES.map((s) => (
                <button key={s} className="chip" onClick={() => void enviar(s)} disabled={ocupado}>
                  {s}
                </button>
              ))}
            </div>
            <div className="composer">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void enviar(texto);
                  }
                }}
                placeholder="Pergunte sobre feminicídio em Mato Grosso do Sul…"
                rows={1}
              />
              <button
                className="btn-enviar"
                onClick={() => void enviar(texto)}
                disabled={ocupado || !texto.trim()}
                title="Enviar"
              >
                <svg viewBox="0 0 16 16" className="ico">
                  <line x1="8" y1="13" x2="8" y2="3" />
                  <polyline points="4,7 8,3 12,7" />
                </svg>
              </button>
            </div>
            <div className="aviso">
              As respostas são geradas a partir da base do Observatório. Confira os números antes de
              publicar.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
