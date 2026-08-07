# Patch do assistente (n8n) — emissão de gráficos

Para a interface desenhar gráficos, o assistente precisa anexar um bloco de
visualização à resposta. Este é o **único** ajuste pendente no workflow
`0B42ncGJyr8HTQ3d` (nó **AI Agent** → `systemMessage`).

## O que fazer

Acrescentar a seção abaixo ao final do systemMessage, **sem remover nada** do
que já existe.

```
## GRÁFICOS
Quando o resultado da consulta for uma SÉRIE (vários anos ou meses), um RANKING
(vários municípios) ou uma COMPARAÇÃO entre grupos, acrescente ao final da
resposta um bloco de visualização no formato abaixo — exatamente um por
resposta, sempre como último elemento:

```chart
{"type":"line","title":"…","subtitle":"…","data":[…],"xAxis":{"key":"…","label":"…"},"yAxis":{"key":"…","label":"…"},"series":[{"key":"…","name":"…"}]}
```

Regras do bloco:
- `type`: "line" para séries temporais; "bar" para comparações entre categorias;
  "table" para rankings com muitas colunas.
- `data`: os MESMOS números que você citou no texto, vindos da consulta — nunca
  invente ou arredonde. Uma linha por ponto do eixo X.
- `series`: uma entrada por medida exibida (ex.: consumado e tentado). Use as
  chaves "consumado" e "tentado" quando aplicável — a interface já as colore.
- Para `type` "table", troque `series` por
  `columns: [{"key":"…","label":"…"}]`.
- NÃO comente o bloco nem o descreva no texto; a interface o remove antes de
  exibir e o transforma no gráfico.
- Se a resposta for um número único ou um fato pontual, NÃO inclua o bloco.
```

## Exemplo de resposta correta

> Entre **2015 e 2025**, Mato Grosso do Sul registrou **1.244 ocorrências** de
> feminicídio — **355 consumados** e **889 tentados**.
>
> Fonte: Painel Mulheres em Evidência – aba Feminicídio (dados atualizados até
> 30/06/2026).
>
> ```chart
> {"type":"line","title":"Evolução Anual (2015–2025)","subtitle":"Consumado e tentado · MS","data":[{"ano":2015,"consumado":15,"tentado":24}],"xAxis":{"key":"ano","label":"Ano"},"yAxis":{"key":"total","label":"Ocorrências"},"series":[{"key":"consumado","name":"Consumado"},{"key":"tentado","name":"Tentado"}]}
> ```

## Depois de aplicar

Rodar as duas suítes para garantir que nada regrediu:

```bash
cd ../mulheres-em-evidencia/eval && python run_eval.py
```

```bash
cd ../mulheres-em-evidencia/eval && python run_eval.py --file gabarito_injection.json
```

Baseline a manter: **19/19** de qualidade e **12/12** de segurança.

> Atenção: o bloco aumenta o tamanho da resposta. Se algum caso do eval passar a
> falhar por truncamento, é sinal de que o modelo está cortando o texto para
> caber o JSON — nesse caso, restringir a emissão do bloco a séries com no
> máximo ~15 pontos.
