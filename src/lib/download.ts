// Exporta o SVG do gráfico como PNG: serializa o SVG, desenha num canvas
// 2x e dispara o download.
export function baixarSvgComoPng(svg: SVGSVGElement | null, nome: string) {
  if (!svg) return;

  const largura = svg.clientWidth || 640;
  const altura = svg.clientHeight || 320;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(largura));
  clone.setAttribute('height', String(altura));

  const fundo = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  fundo.setAttribute('width', '100%');
  fundo.setAttribute('height', '100%');
  fundo.setAttribute('fill', '#FFFFFF');
  clone.insertBefore(fundo, clone.firstChild);

  const texto = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([texto], { type: 'image/svg+xml;charset=utf-8' }));

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = largura * 2;
    canvas.height = altura * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.download = `${nome}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

export function nomeArquivo(titulo: string): string {
  return (
    titulo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'grafico'
  );
}
