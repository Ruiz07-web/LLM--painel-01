# -*- coding: utf-8 -*-
"""Servidor de simulacao do webhook: devolve uma resposta no formato-alvo
(texto + bloco ```chart) com DADOS REAIS da base, para verificar a renderizacao
do grafico e da tabela sem depender do n8n."""
import csv, json, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DADOS = r'C:\Users\omarg\.claude\ocms-projeto\mulheres-em-evidencia\dados'

def serie_estado():
    ea = {int(r['ano']): r for r in csv.DictReader(
        open(os.path.join(DADOS, 'feminicidio_estado_ano.csv'), encoding='utf-8'))}
    return [{'ano': a,
             'consumado': int(ea[a]['ocorrencias_consumados']),
             'tentado': int(ea[a]['ocorrencias_tentados'])}
            for a in range(2015, 2026)]

def ranking_2025():
    ma = [r for r in csv.DictReader(
        open(os.path.join(DADOS, 'feminicidio_municipio_ano.csv'), encoding='utf-8'))
        if int(r['ano']) == 2025]
    ma.sort(key=lambda r: int(r['ocorrencias_total']), reverse=True)
    return [{'municipio': r['municipio'],
             'consumado': int(r['ocorrencias_consumados']),
             'tentado': int(r['ocorrencias_tentados']),
             'total': int(r['ocorrencias_total'])} for r in ma[:10]]

SERIE = serie_estado()
RANK = ranking_2025()

def resposta(pergunta):
    p = pergunta.lower()
    if 'ranking' in p or 'tabela' in p:
        vis = {'type': 'table', 'title': 'Municípios com mais ocorrências em 2025',
               'data': RANK,
               'columns': [{'key': 'municipio', 'label': 'Município'},
                           {'key': 'consumado', 'label': 'Consumado'},
                           {'key': 'tentado', 'label': 'Tentado'},
                           {'key': 'total', 'label': 'Total'}]}
        txt = ('Em **2025**, os municípios com maior número de ocorrências foram:\n\n'
               '| Município | Total |\n| :--- | :---: |\n'
               + '\n'.join(f"| {r['municipio']} | {r['total']} |" for r in RANK[:5])
               + '\n\nFonte: Painel Mulheres em Evidência – aba Feminicídio.')
    elif 'barra' in p or 'compar' in p:
        # Municipios: nomes longos, que é o caso que estressa os rótulos do eixo X.
        vis = {'type': 'bar', 'title': 'Top 8 Municípios por Ocorrências (2025)',
               'subtitle': 'Consumado e tentado · MS',
               'data': RANK[:8], 'xAxis': {'key': 'municipio', 'label': 'Município'},
               'yAxis': {'key': 'total', 'label': 'Ocorrências'},
               'series': [{'key': 'consumado', 'name': 'Consumado'},
                          {'key': 'tentado', 'name': 'Tentado'}]}
        txt = 'Comparativo entre os municípios com mais ocorrências em 2025:'
    else:
        vis = {'type': 'line', 'title': 'Evolução Anual (2015–2025)',
               'subtitle': 'Feminicídio consumado e tentado · Mato Grosso do Sul',
               'data': SERIE, 'xAxis': {'key': 'ano', 'label': 'Ano'},
               'yAxis': {'key': 'total', 'label': 'Ocorrências'},
               'series': [{'key': 'consumado', 'name': 'Consumado'},
                          {'key': 'tentado', 'name': 'Tentado'}]}
        tot_c = sum(r['consumado'] for r in SERIE)
        tot_t = sum(r['tentado'] for r in SERIE)
        txt = (f'Entre **2015 e 2025**, Mato Grosso do Sul registrou **{tot_c + tot_t} ocorrências** '
               f'de feminicídio — **{tot_c} consumados** e **{tot_t} tentados**.\n\n'
               '| Ano | Consumado | Tentado |\n| :--- | :---: | :---: |\n'
               + '\n'.join(f"| {r['ano']} | {r['consumado']} | {r['tentado']} |" for r in SERIE)
               + '\n\nFonte: Painel Mulheres em Evidência – aba Feminicídio.')
    return {'output': txt + '\n\n```chart\n' + json.dumps(vis, ensure_ascii=False) + '\n```'}

class H(BaseHTTPRequestHandler):
    def _cors(self):
        o = self.headers.get('Origin', '*')
        self.send_header('Access-Control-Allow-Origin', o)
        self.send_header('Access-Control-Allow-Headers', 'content-type')
        self.send_header('Access-Control-Allow-Methods', 'OPTIONS, POST')

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0))
        try:
            body = json.loads(self.rfile.read(n).decode('utf-8'))
        except Exception:
            body = {}
        out = json.dumps(resposta(body.get('chatInput', '')), ensure_ascii=False).encode('utf-8')
        self.send_response(200); self._cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(out)))
        self.end_headers(); self.wfile.write(out)

    def log_message(self, *a):
        pass

if __name__ == '__main__':
    print('mock em http://localhost:8901/chat')
    ThreadingHTTPServer(('127.0.0.1', 8901), H).serve_forever()
