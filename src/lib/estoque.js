export const CHAVE_STORAGE = 'controle-estoque:v2';
export const VERSAO_DADOS = 2;

export const LIMITES = {
  nome: 80,
  sku: 40,
  categoria: 40,
  observacao: 140,
  quantidade: 1_000_000,
  preco: 10_000_000,
};

export function dadosVazios() {
  return { versao: VERSAO_DADOS, produtos: [], movimentos: [] };
}

export function novoId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function paraNumero(valor) {
  if (typeof valor === 'number') return valor;
  const texto = String(valor ?? '').trim().replace(',', '.');
  if (texto === '') return 0;
  return Number(texto);
}

export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function statusDe(saldo, estoqueMinimo) {
  if (saldo <= 0) return 'zerado';
  if (saldo <= estoqueMinimo) return 'baixo';
  return 'ok';
}

export function precisaRepor(produto) {
  return produto.status === 'zerado' || produto.status === 'baixo';
}

export function saldoDo(dados, produtoId) {
  let saldo = 0;
  for (const m of dados.movimentos) {
    if (m.produtoId === produtoId) saldo += m.tipo === 'entrada' ? m.quantidade : -m.quantidade;
  }
  return saldo;
}

export function produtosComSaldo(dados) {
  const saldos = new Map();
  for (const m of dados.movimentos) {
    const delta = m.tipo === 'entrada' ? m.quantidade : -m.quantidade;
    saldos.set(m.produtoId, (saldos.get(m.produtoId) || 0) + delta);
  }
  return dados.produtos.map((p) => {
    const saldo = saldos.get(p.id) || 0;
    const status = statusDe(saldo, p.estoqueMinimo);
    return {
      ...p,
      saldo,
      status,
      abaixoDoMinimo: status !== 'ok',
      valorEmEstoque: Math.round(saldo * p.preco * 100) / 100,
    };
  });
}

export function resumo(dados, agora = new Date()) {
  const lista = produtosComSaldo(dados);
  const limite = agora.getTime() - 7 * 24 * 60 * 60 * 1000;
  return {
    totalProdutos: lista.length,
    unidades: lista.reduce((s, p) => s + p.saldo, 0),
    valorEmEstoque: Math.round(lista.reduce((s, p) => s + p.valorEmEstoque, 0) * 100) / 100,
    emAlerta: lista.filter(precisaRepor).length,
    semEstoque: lista.filter((p) => p.status === 'zerado').length,
    movimentos7dias: dados.movimentos.filter((m) => new Date(m.data).getTime() >= limite).length,
  };
}

function textoLimpo(valor) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim();
}

function ehInteiro(n) {
  return Number.isFinite(n) && Number.isInteger(n);
}

export function validarProduto(entrada, dados, { idEditando = null, novo = false } = {}) {
  const erros = {};
  const nome = textoLimpo(entrada.nome);
  const sku = textoLimpo(entrada.sku);
  const categoria = textoLimpo(entrada.categoria);
  const estoqueMinimo = paraNumero(entrada.estoqueMinimo);
  const preco = paraNumero(entrada.preco);
  const estoqueInicial = novo ? paraNumero(entrada.estoqueInicial) : 0;

  if (!nome) erros.nome = 'Informe o nome do produto.';
  else if (nome.length > LIMITES.nome) erros.nome = `Use até ${LIMITES.nome} caracteres.`;

  if (sku.length > LIMITES.sku) erros.sku = `Use até ${LIMITES.sku} caracteres.`;
  else if (sku) {
    const repetido = dados.produtos.some((p) => p.id !== idEditando && normalizar(p.sku) === normalizar(sku));
    if (repetido) erros.sku = 'Já existe um produto com esse SKU.';
  }

  if (categoria.length > LIMITES.categoria) erros.categoria = `Use até ${LIMITES.categoria} caracteres.`;

  if (!ehInteiro(estoqueMinimo) || estoqueMinimo < 0 || estoqueMinimo > LIMITES.quantidade) {
    erros.estoqueMinimo = 'Use um número inteiro maior ou igual a zero.';
  }

  if (!Number.isFinite(preco) || preco < 0 || preco > LIMITES.preco) {
    erros.preco = 'Informe um valor maior ou igual a zero.';
  }

  if (novo && (!ehInteiro(estoqueInicial) || estoqueInicial < 0 || estoqueInicial > LIMITES.quantidade)) {
    erros.estoqueInicial = 'Use um número inteiro maior ou igual a zero.';
  }

  return {
    erros,
    valores: {
      nome,
      sku,
      categoria,
      estoqueMinimo,
      preco: Math.round(preco * 100) / 100,
      estoqueInicial,
    },
  };
}

export function criarProduto(dados, entrada, agora = new Date()) {
  const { erros, valores } = validarProduto(entrada, dados, { novo: true });
  if (Object.keys(erros).length) return { ok: false, erros };

  const produto = {
    id: novoId(),
    nome: valores.nome,
    sku: valores.sku,
    categoria: valores.categoria,
    estoqueMinimo: valores.estoqueMinimo,
    preco: valores.preco,
    criadoEm: agora.toISOString(),
  };
  const movimentos = [...dados.movimentos];
  if (valores.estoqueInicial > 0) {
    movimentos.push({
      id: novoId(),
      produtoId: produto.id,
      tipo: 'entrada',
      quantidade: valores.estoqueInicial,
      observacao: 'Estoque inicial',
      data: agora.toISOString(),
    });
  }
  return { ok: true, produto, dados: { ...dados, produtos: [...dados.produtos, produto], movimentos } };
}

export function editarProduto(dados, id, entrada) {
  const atual = dados.produtos.find((p) => p.id === id);
  if (!atual) return { ok: false, erros: { geral: 'Produto não encontrado.' } };
  const { erros, valores } = validarProduto(entrada, dados, { idEditando: id });
  if (Object.keys(erros).length) return { ok: false, erros };

  const produto = {
    ...atual,
    nome: valores.nome,
    sku: valores.sku,
    categoria: valores.categoria,
    estoqueMinimo: valores.estoqueMinimo,
    preco: valores.preco,
  };
  return {
    ok: true,
    produto,
    dados: { ...dados, produtos: dados.produtos.map((p) => (p.id === id ? produto : p)) },
  };
}

export function removerProduto(dados, id) {
  if (!dados.produtos.some((p) => p.id === id)) {
    return { ok: false, erros: { geral: 'Produto não encontrado.' } };
  }
  return {
    ok: true,
    dados: {
      ...dados,
      produtos: dados.produtos.filter((p) => p.id !== id),
      movimentos: dados.movimentos.filter((m) => m.produtoId !== id),
    },
  };
}

export function registrarMovimento(dados, entrada, agora = new Date()) {
  const erros = {};
  const produtoId = String(entrada.produtoId ?? '');
  const tipo = entrada.tipo;
  const quantidade = paraNumero(entrada.quantidade);
  const observacao = textoLimpo(entrada.observacao);

  if (!dados.produtos.some((p) => p.id === produtoId)) erros.produtoId = 'Selecione um produto.';
  if (!['entrada', 'saida'].includes(tipo)) erros.tipo = 'Escolha entrada ou saída.';

  if (!ehInteiro(quantidade) || quantidade <= 0) {
    erros.quantidade = 'Informe um número inteiro maior que zero.';
  } else if (quantidade > LIMITES.quantidade) {
    erros.quantidade = `O máximo por movimentação é ${LIMITES.quantidade.toLocaleString('pt-BR')}.`;
  } else if (!erros.produtoId && tipo === 'saida') {
    const saldo = saldoDo(dados, produtoId);
    if (quantidade > saldo) erros.quantidade = `Saldo insuficiente. Disponível: ${saldo}.`;
  }

  if (observacao.length > LIMITES.observacao) erros.observacao = `Use até ${LIMITES.observacao} caracteres.`;
  if (Object.keys(erros).length) return { ok: false, erros };

  const movimento = {
    id: novoId(),
    produtoId,
    tipo,
    quantidade,
    observacao,
    data: agora.toISOString(),
  };
  return { ok: true, movimento, dados: { ...dados, movimentos: [...dados.movimentos, movimento] } };
}

export function categoriasDe(dados) {
  return [...new Set(dados.produtos.map((p) => p.categoria).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
}

export function filtrarProdutos(lista, { busca = '', status = 'todos', categoria = '' } = {}) {
  const termo = normalizar(busca);
  return lista.filter((p) => {
    if (status === 'repor' && !precisaRepor(p)) return false;
    if (status === 'ok' && precisaRepor(p)) return false;
    if (categoria && p.categoria !== categoria) return false;
    if (termo && !normalizar(`${p.nome} ${p.sku} ${p.categoria}`).includes(termo)) return false;
    return true;
  });
}

const ORDEM_STATUS = { zerado: 0, baixo: 1, ok: 2 };

function nivel(p) {
  return p.estoqueMinimo > 0 ? p.saldo / p.estoqueMinimo : p.saldo;
}

export function ordenarProdutos(lista, criterio = 'nome') {
  const copia = [...lista];
  const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
  switch (criterio) {
    case 'urgencia':
      return copia.sort((a, b) => ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || nivel(a) - nivel(b) || porNome(a, b));
    case 'saldo':
      return copia.sort((a, b) => a.saldo - b.saldo || porNome(a, b));
    case 'valor':
      return copia.sort((a, b) => b.valorEmEstoque - a.valorEmEstoque || porNome(a, b));
    case 'recentes':
      return copia.sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)) || porNome(a, b));
    default:
      return copia.sort(porNome);
  }
}

export function movimentosComProduto(dados) {
  const nomes = new Map(dados.produtos.map((p) => [p.id, p.nome]));
  return [...dados.movimentos]
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((m) => ({ ...m, produtoNome: nomes.get(m.produtoId) || 'Produto removido' }));
}

export function filtrarMovimentos(lista, { tipo = 'todos', produtoId = '', busca = '' } = {}) {
  const termo = normalizar(busca);
  return lista.filter((m) => {
    if (tipo !== 'todos' && m.tipo !== tipo) return false;
    if (produtoId && m.produtoId !== produtoId) return false;
    if (termo && !normalizar(`${m.produtoNome} ${m.observacao}`).includes(termo)) return false;
    return true;
  });
}

export function chaveDia(data) {
  const d = new Date(data);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function serieMovimentos(dados, dias = 14, agora = new Date()) {
  const serie = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - i);
    serie.push({ chave: chaveDia(d), data: d, entradas: 0, saidas: 0 });
  }
  const indice = new Map(serie.map((s) => [s.chave, s]));
  for (const m of dados.movimentos) {
    const dia = indice.get(chaveDia(m.data));
    if (!dia) continue;
    if (m.tipo === 'entrada') dia.entradas += m.quantidade;
    else dia.saidas += m.quantidade;
  }
  return serie;
}

function celulaCsv(valor) {
  let texto = String(valor ?? '');
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function linhaCsv(valores) {
  return valores.map(celulaCsv).join(';');
}

const STATUS_TEXTO = { ok: 'OK', baixo: 'Repor', zerado: 'Sem estoque' };
export const textoStatus = (status) => STATUS_TEXTO[status] || status;

export function csvProdutos(lista) {
  const linhas = [linhaCsv(['Produto', 'SKU', 'Categoria', 'Saldo', 'Estoque mínimo', 'Preço unitário', 'Valor em estoque', 'Status'])];
  for (const p of lista) {
    linhas.push(
      linhaCsv([
        p.nome,
        p.sku,
        p.categoria,
        p.saldo,
        p.estoqueMinimo,
        p.preco.toFixed(2).replace('.', ','),
        p.valorEmEstoque.toFixed(2).replace('.', ','),
        textoStatus(p.status),
      ])
    );
  }
  return linhas.join('\r\n');
}

export function csvMovimentos(lista) {
  const linhas = [linhaCsv(['Data', 'Produto', 'Tipo', 'Quantidade', 'Observação'])];
  for (const m of lista) {
    linhas.push(
      linhaCsv([
        new Date(m.data).toLocaleString('pt-BR'),
        m.produtoNome,
        m.tipo === 'entrada' ? 'Entrada' : 'Saída',
        m.quantidade,
        m.observacao,
      ])
    );
  }
  return linhas.join('\r\n');
}

export function serializarBackup(dados) {
  return JSON.stringify({ ...dados, versao: VERSAO_DADOS, exportadoEm: new Date().toISOString() }, null, 2);
}

export function lerBackup(texto) {
  let bruto;
  try {
    bruto = JSON.parse(texto);
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  if (!bruto || typeof bruto !== 'object' || !Array.isArray(bruto.produtos) || !Array.isArray(bruto.movimentos)) {
    throw new Error('O arquivo não parece ser um backup do Controle de Estoque.');
  }

  const idsUsados = new Set();
  const produtos = [];
  for (const p of bruto.produtos) {
    const id = String(p?.id ?? '');
    const nome = textoLimpo(p?.nome).slice(0, LIMITES.nome);
    if (!id || !nome || idsUsados.has(id)) continue;
    idsUsados.add(id);
    const minimo = Number(p.estoqueMinimo);
    const preco = Number(p.preco);
    produtos.push({
      id,
      nome,
      sku: textoLimpo(p.sku).slice(0, LIMITES.sku),
      categoria: textoLimpo(p.categoria).slice(0, LIMITES.categoria),
      estoqueMinimo: ehInteiro(minimo) && minimo >= 0 ? minimo : 0,
      preco: Number.isFinite(preco) && preco >= 0 ? Math.round(preco * 100) / 100 : 0,
      criadoEm: typeof p.criadoEm === 'string' ? p.criadoEm : new Date(0).toISOString(),
    });
  }

  const idsProdutos = new Set(produtos.map((p) => p.id));
  const idsMov = new Set();
  const movimentos = [];
  for (const m of bruto.movimentos) {
    const produtoId = String(m?.produtoId ?? '');
    const quantidade = Number(m?.quantidade);
    const data = new Date(m?.data);
    if (!idsProdutos.has(produtoId)) continue;
    if (!['entrada', 'saida'].includes(m.tipo)) continue;
    if (!ehInteiro(quantidade) || quantidade <= 0) continue;
    if (Number.isNaN(data.getTime())) continue;
    let id = String(m.id ?? '');
    if (!id || idsMov.has(id)) id = novoId();
    idsMov.add(id);
    movimentos.push({
      id,
      produtoId,
      tipo: m.tipo,
      quantidade,
      observacao: textoLimpo(m.observacao).slice(0, LIMITES.observacao),
      data: data.toISOString(),
    });
  }

  const saldos = new Map();
  for (const m of movimentos) {
    const novo = (saldos.get(m.produtoId) || 0) + (m.tipo === 'entrada' ? m.quantidade : -m.quantidade);
    if (novo < 0) {
      const nome = produtos.find((p) => p.id === m.produtoId)?.nome;
      throw new Error(`O backup tem uma saída maior que o saldo em "${nome}".`);
    }
    saldos.set(m.produtoId, novo);
  }

  return { versao: VERSAO_DADOS, produtos, movimentos };
}

export function carregarDados(texto) {
  if (!texto) return dadosVazios();
  try {
    return lerBackup(texto);
  } catch {
    return dadosVazios();
  }
}

const EXEMPLO_PRODUTOS = [
  { nome: 'Camiseta básica preta M', sku: 'CAM-PRT-M', categoria: 'Vestuário', estoqueMinimo: 10, preco: 39.9,
    mov: [[-13, 'entrada', 40, 'Estoque inicial'], [-11, 'saida', 8, 'Venda balcão'], [-8, 'saida', 12, 'Pedido online'], [-5, 'saida', 9, 'Venda balcão'], [-2, 'saida', 6, 'Pedido online']] },
  { nome: 'Camiseta básica branca G', sku: 'CAM-BRC-G', categoria: 'Vestuário', estoqueMinimo: 10, preco: 39.9,
    mov: [[-13, 'entrada', 30, 'Estoque inicial'], [-10, 'saida', 5, 'Venda balcão'], [-6, 'saida', 7, 'Pedido online'], [-1, 'saida', 3, 'Venda balcão']] },
  { nome: 'Boné aba reta', sku: 'BON-ABR', categoria: 'Acessórios', estoqueMinimo: 6, preco: 49.9,
    mov: [[-12, 'entrada', 20, 'Estoque inicial'], [-9, 'saida', 6, 'Venda balcão'], [-4, 'saida', 5, 'Pedido online'], [-2, 'saida', 4, 'Venda balcão']] },
  { nome: 'Garrafa térmica 500 ml', sku: 'GAR-500', categoria: 'Utilidades', estoqueMinimo: 8, preco: 64.9,
    mov: [[-13, 'entrada', 25, 'Estoque inicial'], [-10, 'saida', 4, 'Venda balcão'], [-7, 'saida', 6, 'Pedido online'], [-3, 'entrada', 10, 'Reposição do fornecedor'], [-1, 'saida', 3, 'Venda balcão']] },
  { nome: 'Caderno universitário 10 matérias', sku: 'CAD-U10', categoria: 'Papelaria', estoqueMinimo: 15, preco: 24.5,
    mov: [[-13, 'entrada', 60, 'Estoque inicial'], [-9, 'saida', 15, 'Venda balcão'], [-6, 'saida', 18, 'Pedido escola'], [-3, 'saida', 12, 'Venda balcão'], [-1, 'saida', 6, 'Venda balcão']] },
  { nome: 'Caneta esferográfica azul (caixa 50)', sku: 'CAN-AZ50', categoria: 'Papelaria', estoqueMinimo: 5, preco: 32,
    mov: [[-12, 'entrada', 12, 'Estoque inicial'], [-8, 'saida', 3, 'Pedido escola'], [-4, 'saida', 2, 'Venda balcão']] },
  { nome: 'Mochila executiva', sku: 'MOC-EXE', categoria: 'Acessórios', estoqueMinimo: 4, preco: 189.9,
    mov: [[-13, 'entrada', 10, 'Estoque inicial'], [-9, 'saida', 3, 'Venda balcão'], [-5, 'saida', 2, 'Pedido online'], [-1, 'saida', 5, 'Pedido empresa']] },
  { nome: 'Fone de ouvido Bluetooth', sku: 'FON-BT', categoria: 'Eletrônicos', estoqueMinimo: 5, preco: 129.9,
    mov: [[-12, 'entrada', 15, 'Estoque inicial'], [-8, 'saida', 4, 'Pedido online'], [-5, 'saida', 3, 'Venda balcão'], [-2, 'saida', 2, 'Venda balcão']] },
  { nome: 'Carregador USB-C 20 W', sku: 'CAR-C20', categoria: 'Eletrônicos', estoqueMinimo: 8, preco: 59.9,
    mov: [[-13, 'entrada', 40, 'Estoque inicial'], [-10, 'saida', 10, 'Pedido online'], [-7, 'saida', 8, 'Venda balcão'], [-5, 'saida', 7, 'Pedido online'], [-2, 'entrada', 20, 'Reposição do fornecedor'], [-1, 'saida', 5, 'Venda balcão']] },
  { nome: 'Copo térmico 300 ml', sku: 'COP-300', categoria: 'Utilidades', estoqueMinimo: 6, preco: 44.9,
    mov: [[-11, 'entrada', 18, 'Estoque inicial'], [-7, 'saida', 3, 'Venda balcão'], [-4, 'saida', 4, 'Pedido online'], [-2, 'saida', 2, 'Venda balcão']] },
];

export function dadosExemplo(agora = new Date()) {
  const produtos = [];
  const movimentos = [];
  EXEMPLO_PRODUTOS.forEach((ex, i) => {
    const id = `exemplo-p${i + 1}`;
    const { mov, ...campos } = ex;
    produtos.push({ id, ...campos, criadoEm: new Date(agora.getTime() - 14 * 86_400_000).toISOString() });
    mov.forEach(([dias, tipo, quantidade, observacao], j) => {
      const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + dias, 9 + ((i + j) % 8), (i * 7 + j * 13) % 60);
      movimentos.push({ id: `exemplo-m${i + 1}-${j + 1}`, produtoId: id, tipo, quantidade, observacao, data: data.toISOString() });
    });
  });
  movimentos.sort((a, b) => a.data.localeCompare(b.data));
  return { versao: VERSAO_DADOS, produtos, movimentos };
}
