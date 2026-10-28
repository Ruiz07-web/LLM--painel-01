import type { Visualization } from '../types';

const WEBHOOK = import.meta.env.VITE_WEBHOOK_URL as string;
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 180000);

export const FONTE =
  'Fonte: Painel Mulheres em Evidência – Observatório da Cidadania de MS (dados atualizados até setembro de 2026).';

export const CORES = {
  consumado: '#8B0000',
  tentado: '#FF6B6B',
  primaria: '#1F3864',
  extra: ['#1F3864', '#31538F', '#8B0000', '#FF6B6B'],
};

export interface RespostaAssistente {
  texto: string;
  visualization?: Visualization;
}

// O assistente pode devolver a visualização de duas formas:
// (a) campo `visualization` no JSON da resposta;
// (b) bloco cercado ```chart { ... } ``` dentro do texto — usado enquanto o
//     workflow do n8n ainda não emite o campo dedicado.
const BLOCO_CHART = /```chart\s*([\s\S]*?)```/i;

export function extrairVisualizacao(texto: string): {
  limpo: string;
  visualization?: Visualization;
} {
  const m = texto.match(BLOCO_CHART);
  if (!m) return { limpo: texto };
  let visualization: Visualization | undefined;
  try {
    visualization = JSON.parse(m[1].trim()) as Visualization;
  } catch {
    visualization = undefined;
  }
  return { limpo: texto.replace(BLOCO_CHART, '').trim(), visualization };
}

export async function perguntar(
  pergunta: string,
  sessionId: string,
): Promise<RespostaAssistente> {
  if (!WEBHOOK) throw new Error('VITE_WEBHOOK_URL não configurada.');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const resp = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: pergunta }),
      signal: ctrl.signal,
    });
    if (!resp.ok) throw new Error(`O servidor respondeu ${resp.status}.`);

    const json = (await resp.json()) as { output?: string; visualization?: Visualization };
    const bruto = json.output ?? '';
    const { limpo, visualization } = extrairVisualizacao(bruto);
    return { texto: limpo, visualization: json.visualization ?? visualization };
  } finally {
    clearTimeout(timer);
  }
}
