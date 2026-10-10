import { produtosComSaldo, resumo, textoStatus } from './estoque.js';
import { formatarMoeda, formatarNumero, sufixoData } from './format.js';

export async function gerarRelatorioPdf(dados) {
  const [{ jsPDF }, autoTableModulo] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = autoTableModulo.default || autoTableModulo.autoTable;

  const agora = new Date();
  const produtos = produtosComSaldo(dados).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const r = resumo(dados, agora);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 22, 41);
  doc.text('Relatório de estoque', 40, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(86, 96, 116);
  doc.text(`Gerado em ${agora.toLocaleString('pt-BR')}`, 40, 72);

  const resumoLinhas = [
    ['Produtos', formatarNumero(r.totalProdutos)],
    ['Unidades em estoque', formatarNumero(r.unidades)],
    ['Valor em estoque', formatarMoeda(r.valorEmEstoque)],
    ['Precisam de reposição', formatarNumero(r.emAlerta)],
  ];
  const colunaLargura = (largura - 80) / resumoLinhas.length;
  resumoLinhas.forEach(([rotulo, valor], i) => {
    const x = 40 + i * colunaLargura;
    doc.setFontSize(9);
    doc.setTextColor(86, 96, 116);
    doc.text(rotulo, x, 102);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 22, 41);
    doc.text(valor, x, 120);
    doc.setFont('helvetica', 'normal');
  });

  autoTable(doc, {
    startY: 142,
    margin: { left: 40, right: 40, bottom: 40 },
    head: [['Produto', 'Categoria', 'SKU', 'Saldo', 'Mínimo', 'Preço', 'Valor', 'Status']],
    body: produtos.map((p) => [
      p.nome,
      p.categoria || '-',
      p.sku || '-',
      formatarNumero(p.saldo),
      formatarNumero(p.estoqueMinimo),
      formatarMoeda(p.preco),
      formatarMoeda(p.valorEmEstoque),
      textoStatus(p.status),
    ]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [15, 22, 41], lineColor: [217, 222, 231] },
    headStyles: { fillColor: [42, 58, 168], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 247, 250] },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { fontStyle: 'bold', cellWidth: 66 },
    },
    didParseCell(dado) {
      if (dado.section !== 'body') return;
      const produto = produtos[dado.row.index];
      if (produto && produto.status !== 'ok') {
        dado.cell.styles.fillColor = [255, 240, 232];
        if (dado.column.index === 7) dado.cell.styles.textColor = [185, 60, 10];
      }
    },
  });

  if (produtos.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(86, 96, 116);
    doc.text('Nenhum produto cadastrado.', 40, 190);
  }

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text(`Página ${i} de ${total}`, largura - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
  }

  doc.save(`relatorio-estoque-${sufixoData(agora)}.pdf`);
}
