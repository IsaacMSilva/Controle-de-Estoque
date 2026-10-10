import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dadosVazios,
  criarProduto,
  editarProduto,
  removerProduto,
  registrarMovimento,
  produtosComSaldo,
  resumo,
  filtrarProdutos,
  ordenarProdutos,
  movimentosComProduto,
  filtrarMovimentos,
  serieMovimentos,
  csvProdutos,
  csvMovimentos,
  lerBackup,
  serializarBackup,
  carregarDados,
  dadosExemplo,
  statusDe,
  paraNumero,
} from '../src/lib/estoque.js';

const AGORA = new Date(2026, 9, 9, 12, 0, 0);

function comProduto(entrada = {}) {
  const r = criarProduto(dadosVazios(), { nome: 'Camiseta', sku: 'CAM-1', categoria: 'Roupas', estoqueMinimo: 5, preco: '39,90', ...entrada }, AGORA);
  assert.ok(r.ok, JSON.stringify(r.erros));
  return r;
}

test('paraNumero aceita vírgula, ponto e vazio', () => {
  assert.equal(paraNumero('12,50'), 12.5);
  assert.equal(paraNumero('12.5'), 12.5);
  assert.equal(paraNumero(''), 0);
  assert.ok(Number.isNaN(paraNumero('abc')));
});

test('statusDe classifica zerado, baixo e ok', () => {
  assert.equal(statusDe(0, 5), 'zerado');
  assert.equal(statusDe(5, 5), 'baixo');
  assert.equal(statusDe(6, 5), 'ok');
});

test('criarProduto exige nome e valida números', () => {
  const vazio = dadosVazios();
  assert.ok(criarProduto(vazio, { nome: '   ' }).erros.nome);
  assert.ok(criarProduto(vazio, { nome: 'A', estoqueMinimo: -1 }).erros.estoqueMinimo);
  assert.ok(criarProduto(vazio, { nome: 'A', estoqueMinimo: 1.5 }).erros.estoqueMinimo);
  assert.ok(criarProduto(vazio, { nome: 'A', preco: -3 }).erros.preco);
  assert.ok(criarProduto(vazio, { nome: 'A', estoqueInicial: 'x' }).erros.estoqueInicial);
});

test('criarProduto cria movimento de estoque inicial', () => {
  const { dados, produto } = comProduto({ estoqueInicial: 12 });
  assert.equal(dados.movimentos.length, 1);
  const [p] = produtosComSaldo(dados);
  assert.equal(p.id, produto.id);
  assert.equal(p.saldo, 12);
  assert.equal(p.valorEmEstoque, 478.8);
});

test('SKU repetido é recusado (sem diferenciar maiúsculas)', () => {
  const { dados } = comProduto();
  const r = criarProduto(dados, { nome: 'Outra', sku: 'cam-1' }, AGORA);
  assert.equal(r.ok, false);
  assert.ok(r.erros.sku);
});

test('editarProduto mantém o próprio SKU e atualiza campos', () => {
  const { dados, produto } = comProduto();
  const r = editarProduto(dados, produto.id, { nome: 'Camiseta nova', sku: 'CAM-1', categoria: '', estoqueMinimo: 2, preco: 50 });
  assert.ok(r.ok);
  assert.equal(r.dados.produtos[0].nome, 'Camiseta nova');
  assert.equal(r.dados.produtos[0].estoqueMinimo, 2);
  assert.equal(r.dados.produtos[0].id, produto.id);
});

test('saída acima do saldo é bloqueada; dentro do saldo é aceita', () => {
  const { dados, produto } = comProduto({ estoqueInicial: 10 });
  const ruim = registrarMovimento(dados, { produtoId: produto.id, tipo: 'saida', quantidade: 11 }, AGORA);
  assert.equal(ruim.ok, false);
  assert.match(ruim.erros.quantidade, /Saldo insuficiente\. Disponível: 10/);

  const boa = registrarMovimento(dados, { produtoId: produto.id, tipo: 'saida', quantidade: '4' }, AGORA);
  assert.ok(boa.ok);
  assert.equal(produtosComSaldo(boa.dados)[0].saldo, 6);
});

test('movimentação rejeita quantidade inválida, tipo inválido e produto inexistente', () => {
  const { dados, produto } = comProduto();
  assert.ok(registrarMovimento(dados, { produtoId: produto.id, tipo: 'entrada', quantidade: 0 }).erros.quantidade);
  assert.ok(registrarMovimento(dados, { produtoId: produto.id, tipo: 'entrada', quantidade: 2.5 }).erros.quantidade);
  assert.ok(registrarMovimento(dados, { produtoId: produto.id, tipo: 'troca', quantidade: 1 }).erros.tipo);
  assert.ok(registrarMovimento(dados, { produtoId: 'nao-existe', tipo: 'entrada', quantidade: 1 }).erros.produtoId);
});

test('operações não alteram os dados originais (imutabilidade)', () => {
  const { dados, produto } = comProduto({ estoqueInicial: 3 });
  const copia = structuredClone(dados);
  registrarMovimento(dados, { produtoId: produto.id, tipo: 'entrada', quantidade: 2 }, AGORA);
  removerProduto(dados, produto.id);
  assert.deepEqual(dados, copia);
});

test('removerProduto apaga também o histórico dele', () => {
  const { dados, produto } = comProduto({ estoqueInicial: 3 });
  const r = removerProduto(dados, produto.id);
  assert.ok(r.ok);
  assert.equal(r.dados.produtos.length, 0);
  assert.equal(r.dados.movimentos.length, 0);
  assert.equal(removerProduto(dados, 'x').ok, false);
});

test('resumo soma unidades, valor e alertas', () => {
  const ex = dadosExemplo(AGORA);
  const r = resumo(ex, AGORA);
  const lista = produtosComSaldo(ex);
  assert.equal(r.totalProdutos, 10);
  assert.equal(r.unidades, lista.reduce((s, p) => s + p.saldo, 0));
  assert.ok(r.emAlerta >= 3);
  assert.equal(r.semEstoque, 1);
  assert.ok(r.movimentos7dias > 0);
});

test('dados de exemplo nunca têm saldo negativo, mesmo em ordem cronológica', () => {
  const ex = dadosExemplo(AGORA);
  const saldos = new Map();
  for (const m of [...ex.movimentos].sort((a, b) => a.data.localeCompare(b.data))) {
    const novo = (saldos.get(m.produtoId) || 0) + (m.tipo === 'entrada' ? m.quantidade : -m.quantidade);
    assert.ok(novo >= 0, `saldo negativo em ${m.produtoId}`);
    saldos.set(m.produtoId, novo);
  }
  assert.ok(ex.movimentos.every((m) => new Date(m.data) <= AGORA), 'movimento no futuro');
});

test('busca ignora acentos e maiúsculas; filtros combinam', () => {
  const ex = produtosComSaldo(dadosExemplo(AGORA));
  assert.equal(filtrarProdutos(ex, { busca: 'BONE' }).length, 1);
  assert.equal(filtrarProdutos(ex, { busca: 'universitario' }).length, 1);
  const repor = filtrarProdutos(ex, { status: 'repor' });
  assert.ok(repor.length > 0 && repor.every((p) => p.status !== 'ok'));
  assert.ok(filtrarProdutos(ex, { categoria: 'Papelaria' }).every((p) => p.categoria === 'Papelaria'));
});

test('ordenação por urgência coloca o zerado primeiro', () => {
  const ex = produtosComSaldo(dadosExemplo(AGORA));
  const ordenado = ordenarProdutos(ex, 'urgencia');
  assert.equal(ordenado[0].status, 'zerado');
  assert.equal(ordenado.at(-1).status, 'ok');
  const porNome = ordenarProdutos(ex, 'nome').map((p) => p.nome);
  assert.deepEqual(porNome, [...porNome].sort((a, b) => a.localeCompare(b, 'pt-BR')));
});

test('movimentos vêm do mais novo para o mais antigo e aceitam filtros', () => {
  const ex = dadosExemplo(AGORA);
  const lista = movimentosComProduto(ex);
  for (let i = 1; i < lista.length; i++) assert.ok(lista[i - 1].data >= lista[i].data);
  assert.ok(filtrarMovimentos(lista, { tipo: 'entrada' }).every((m) => m.tipo === 'entrada'));
  assert.ok(filtrarMovimentos(lista, { busca: 'reposicao' }).length >= 2);
});

test('série do gráfico tem um item por dia e totaliza os movimentos', () => {
  const ex = dadosExemplo(AGORA);
  const serie = serieMovimentos(ex, 14, AGORA);
  assert.equal(serie.length, 14);
  const entradas = serie.reduce((s, d) => s + d.entradas, 0);
  const saidas = serie.reduce((s, d) => s + d.saidas, 0);
  const esperadoEntradas = ex.movimentos.filter((m) => m.tipo === 'entrada').reduce((s, m) => s + m.quantidade, 0);
  assert.equal(entradas, esperadoEntradas);
  assert.ok(saidas > 0);
});

test('CSV escapa aspas, ponto e vírgula e bloqueia fórmulas', () => {
  const csv = csvProdutos([
    { nome: '=SOMA(A1)', sku: 'A;B', categoria: 'Diz "oi"', saldo: 1, estoqueMinimo: 1, preco: 1.5, valorEmEstoque: 1.5, status: 'baixo' },
  ]);
  const [, linha] = csv.split('\r\n');
  assert.ok(linha.startsWith("'=SOMA(A1);"));
  assert.ok(linha.includes('"A;B"'));
  assert.ok(linha.includes('"Diz ""oi"""'));
  assert.ok(linha.includes('1,50'));
  assert.ok(csvMovimentos([]).startsWith('Data;Produto;Tipo'));
});

test('backup: ida e volta preserva os dados', () => {
  const ex = dadosExemplo(AGORA);
  const lido = lerBackup(serializarBackup(ex));
  assert.deepEqual(lido.produtos, ex.produtos);
  assert.deepEqual(lido.movimentos, ex.movimentos);
});

test('backup: aceita o data.json da versão antiga (ids numéricos)', () => {
  const antigo = JSON.stringify({
    produtos: [{ id: 1, nome: 'Parafuso', sku: 'P-1', categoria: 'Ferragens', estoqueMinimo: 10 }],
    movimentos: [
      { id: 1, produtoId: 1, tipo: 'entrada', quantidade: 50, observacao: 'NF 1', data: '2026-01-10T12:00:00.000Z' },
      { id: 2, produtoId: 1, tipo: 'saida', quantidade: 20, observacao: '', data: '2026-01-11T12:00:00.000Z' },
    ],
  });
  const dados = lerBackup(antigo);
  assert.equal(dados.produtos[0].id, '1');
  assert.equal(dados.produtos[0].preco, 0);
  assert.equal(produtosComSaldo(dados)[0].saldo, 30);
});

test('backup: recusa JSON inválido, formato errado e saldo negativo', () => {
  assert.throws(() => lerBackup('{quebrado'), /JSON válido/);
  assert.throws(() => lerBackup('{"foo":1}'), /não parece/);
  const negativo = JSON.stringify({
    produtos: [{ id: 'a', nome: 'X' }],
    movimentos: [{ id: 'm', produtoId: 'a', tipo: 'saida', quantidade: 5, data: '2026-01-01T00:00:00Z' }],
  });
  assert.throws(() => lerBackup(negativo), /maior que o saldo/);
});

test('backup: descarta lixo (produto sem nome, movimento órfão)', () => {
  const dados = lerBackup(
    JSON.stringify({
      produtos: [{ id: 'a', nome: 'Ok' }, { id: 'b', nome: '' }, null],
      movimentos: [
        { id: '1', produtoId: 'a', tipo: 'entrada', quantidade: 2, data: '2026-01-01T00:00:00Z' },
        { id: '2', produtoId: 'zzz', tipo: 'entrada', quantidade: 2, data: '2026-01-01T00:00:00Z' },
        { id: '3', produtoId: 'a', tipo: 'entrada', quantidade: -2, data: '2026-01-01T00:00:00Z' },
        { id: '4', produtoId: 'a', tipo: 'entrada', quantidade: 2, data: 'ontem' },
      ],
    })
  );
  assert.equal(dados.produtos.length, 1);
  assert.equal(dados.movimentos.length, 1);
});

test('carregarDados volta vazio quando o armazenamento está corrompido', () => {
  assert.deepEqual(carregarDados(null), dadosVazios());
  assert.deepEqual(carregarDados('lixo'), dadosVazios());
});
