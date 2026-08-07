# Interface de Gráficos Dinâmicos — Assistente Mulheres em Evidência (OCMS)

Interface de chat que consulta o assistente de feminicídio (n8n + Gemini + Supabase)
e renderiza **gráficos gerados sob demanda** a partir da resposta.

Design conforme o handoff do Claude Design (julho/2026): Calibri + Montserrat,
azul OCMS `#1F3864`, consumado `#8B0000`, tentado `#FF6B6B`.

---

## Como o gráfico aparece

O front aceita a visualização de **duas formas**, nesta ordem de precedência:

1. **Campo dedicado** no JSON da resposta:
   ```json
   { "output": "texto…", "visualization": { … } }
   ```
2. **Bloco cercado** dentro do próprio texto (usado enquanto o workflow do n8n
   ainda não emite o campo dedicado):
   ````
   ```chart
   { "type": "line", "title": "…", "data": [ … ] }
   ```
   ````

O bloco é removido do texto antes de exibir, então o usuário nunca vê o JSON.

### Contrato da visualização

```json
{
  "type": "line",
  "title": "Evolução Anual (2015–2025)",
  "subtitle": "Feminicídio consumado e tentado · Mato Grosso do Sul",
  "data": [
    { "ano": 2015, "consumado": 15, "tentado": 24 },
    { "ano": 2016, "consumado": 34, "tentado": 60 }
  ],
  "xAxis": { "key": "ano",   "label": "Ano" },
  "yAxis": { "key": "total", "label": "Ocorrências" },
  "series": [
    { "key": "consumado", "name": "Consumado", "color": "#8B0000" },
    { "key": "tentado",   "name": "Tentado",   "color": "#FF6B6B" }
  ]
}
```

- `type`: `line` | `bar` | `table`
- `series[].color` é opcional — sem ele a cor sai por convenção do nome da chave
  (`consum*` → vermelho escuro, `tent*` → vermelho claro).
- Para `table`, use `columns: [{ key, label }]` no lugar de `series`.

---

## Rodar localmente

Requer Node.js 18+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Checagem de tipos

O `build` roda apenas `vite build` (esbuild remove os tipos sem verificá-los),
para que um detalhe de tipagem não derrube o deploy. A verificação é um passo
separado — rode antes de abrir PR ou publicar mudanças maiores:

```bash
npm run typecheck
```

### Pré-visualização sem Node

`preview.html` roda a mesma interface via CDN, sem build — útil para conferir o
visual e testar o webhook sem instalar nada:

```bash
python -m http.server 8900
```

Depois abra `http://localhost:8900/preview.html`. Para apontar para outro
webhook: `preview.html?webhook=<url>`.

---

## Deploy no Vercel

O build roda na nuvem — não é preciso ter Node na máquina.

1. Suba o repositório no GitHub.
2. No Vercel: **New Project** → importe o repositório.
3. O Vercel detecta Vite sozinho (build `npm run build`, saída `dist`).
4. Em **Settings → Environment Variables**, adicione:

   | Nome | Valor |
   |---|---|
   | `VITE_WEBHOOK_URL` | URL do webhook de chat do n8n |
   | `VITE_API_TIMEOUT` | `180000` |

5. Deploy.

> As variáveis `VITE_*` são embutidas no bundle e ficam visíveis no navegador —
> use apenas valores públicos. O webhook do chat já é público por natureza; as
> credenciais do banco ficam no n8n e **nunca** passam pelo front.

---

## Estrutura

```
src/
├── App.tsx                  layout, estado do chat, envio
├── main.tsx                 ponto de entrada
├── styles.css               tokens e estilos (tema OCMS)
├── types.ts                 tipos de mensagem e visualização
├── lib/
│   ├── api.ts               chamada ao webhook + extração da visualização
│   ├── markdown.tsx         parser de negrito e listas
│   └── download.ts          exportação do gráfico em PNG
└── components/
    ├── ChartCard.tsx        gráficos de linha e barra (Recharts)
    └── TableCard.tsx        tabela com ordenação por coluna
```

---

## Pendências conhecidas

- O workflow do n8n **ainda não emite** a visualização; até lá as respostas
  chegam só em texto. Ver "Como o gráfico aparece" para o formato esperado.
- Histórico de conversas é apenas de sessão (não persiste).
- Modo escuro fora do MVP (tokens já preparados para inversão).
