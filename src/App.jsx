import { useCallback, useMemo, useRef, useState } from 'react';
import { useEstoque } from './hooks/useEstoque.js';
import { useRota } from './hooks/useRota.js';
import { useTema } from './hooks/useTema.js';
import {
  categoriasDe,
  csvMovimentos,
  csvProdutos,
  lerBackup,
  movimentosComProduto,
  precisaRepor,
  produtosComSaldo,
  resumo,
  serializarBackup,
  serieMovimentos,
} from './lib/estoque.js';
import { baixarArquivo, sufixoData } from './lib/format.js';
import { Logo, IconeAviso, IconeLua, IconeSol } from './components/Icones.jsx';
import Avisos from './components/Avisos.jsx';
import Confirmacao from './components/Confirmacao.jsx';
import ProdutoDialogo from './components/ProdutoDialogo.jsx';
import MovimentoDialogo from './components/MovimentoDialogo.jsx';
import Painel from './views/Painel.jsx';
import Produtos from './views/Produtos.jsx';
import Movimentos from './views/Movimentos.jsx';
import Dados from './views/Dados.jsx';

const ABAS = [
  ['painel', 'Painel'],
  ['produtos', 'Produtos'],
  ['movimentos', 'Histórico'],
  ['dados', 'Dados'],
];

export default function App() {
  const estoque = useEstoque();
  const [rota, ir] = useRota();
  const [tema, alternarTema] = useTema();

  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [dialogoProduto, setDialogoProduto] = useState({ aberto: false, produto: null });
  const [dialogoMov, setDialogoMov] = useState({ aberto: false, inicial: {} });
  const [pedido, setPedido] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const proximoAviso = useRef(1);

  const { dados } = estoque;
  const produtos = useMemo(() => produtosComSaldo(dados), [dados]);
  const movimentos = useMemo(() => movimentosComProduto(dados), [dados]);
  const categorias = useMemo(() => categoriasDe(dados), [dados]);
  const resumoGeral = useMemo(() => resumo(dados), [dados]);
  const serie = useMemo(() => serieMovimentos(dados, 14), [dados]);
  const qtdRepor = useMemo(() => produtos.filter(precisaRepor).length, [produtos]);
  const temDados = dados.produtos.length > 0;

  const avisar = useCallback((texto, tipo = 'ok') => {
    const id = proximoAviso.current++;
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === 'erro' ? 6000 : 3500);
  }, []);

  const abrirNovoProduto = () => setDialogoProduto({ aberto: true, produto: null });
  const abrirEditar = (produto) => setDialogoProduto({ aberto: true, produto });
  const fecharProduto = () => setDialogoProduto((d) => ({ ...d, aberto: false }));

  function salvarProduto(form) {
    const editando = dialogoProduto.produto;
    const r = editando ? estoque.editarProduto(editando.id, form) : estoque.criarProduto(form);
    if (r.ok) {
      fecharProduto();
      avisar(editando ? 'Produto atualizado.' : `“${r.produto.nome}” cadastrado.`);
    }
    return r;
  }

  function pedirExclusao(produto) {
    setPedido({
      titulo: 'Excluir produto?',
      mensagem: `“${produto.nome}” e todo o histórico de movimentações dele serão apagados. Isso não pode ser desfeito.`,
      confirmar: 'Excluir',
      perigo: true,
      acao: () => {
        const r = estoque.removerProduto(produto.id);
        avisar(r.ok ? 'Produto excluído.' : r.erros.geral, r.ok ? 'ok' : 'erro');
      },
    });
  }

  const abrirMovimento = (produtoId = '', tipo = 'entrada') =>
    setDialogoMov({ aberto: true, inicial: { produtoId, tipo } });
  const fecharMovimento = () => setDialogoMov((d) => ({ ...d, aberto: false }));

  function salvarMovimento(form) {
    const r = estoque.registrarMovimento(form);
    if (r.ok) {
      fecharMovimento();
      const nome = dados.produtos.find((p) => p.id === r.movimento.produtoId)?.nome;
      avisar(`${r.movimento.tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${r.movimento.quantidade} em “${nome}” registrada.`);
    }
    return r;
  }

  async function gerarPdf() {
    setGerandoPdf(true);
    try {
      const { gerarRelatorioPdf } = await import('./lib/pdf.js');
      await gerarRelatorioPdf(dados);
    } catch (e) {
      console.error(e);
      avisar('Não foi possível gerar o PDF. Tente de novo.', 'erro');
    } finally {
      setGerandoPdf(false);
    }
  }

  const baixarCsv = (nome, conteudo) => baixarArquivo(`${nome}-${sufixoData()}.csv`, `\uFEFF${conteudo}`, 'text/csv;charset=utf-8');

  const baixarBackup = () => {
    baixarArquivo(`backup-estoque-${sufixoData()}.json`, serializarBackup(dados), 'application/json');
    avisar('Backup baixado.');
  };

  async function restaurar(arquivo) {
    try {
      if (arquivo.size > 10 * 1024 * 1024) throw new Error('O arquivo é grande demais para ser um backup.');
      const novos = lerBackup(await arquivo.text());
      setPedido({
        titulo: 'Restaurar backup?',
        mensagem: `Os dados atuais serão substituídos por ${novos.produtos.length} produto(s) e ${novos.movimentos.length} movimentação(ões) do arquivo.`,
        confirmar: 'Restaurar',
        acao: () => {
          estoque.substituirDados(novos);
          avisar('Backup restaurado.');
        },
      });
    } catch (e) {
      avisar(e.message, 'erro');
    }
  }

  function pedirExemplo() {
    const carregar = () => {
      estoque.carregarExemplo();
      avisar('Dados de exemplo carregados.');
    };
    if (!temDados && dados.movimentos.length === 0) return carregar();
    setPedido({
      titulo: 'Carregar dados de exemplo?',
      mensagem: 'Os dados atuais serão substituídos pelos exemplos. Baixe um backup antes se quiser guardá-los.',
      confirmar: 'Substituir',
      acao: carregar,
    });
  }

  function pedirLimpeza() {
    setPedido({
      titulo: 'Apagar todos os dados?',
      mensagem: 'Todos os produtos e movimentações salvos neste navegador serão apagados. Isso não pode ser desfeito.',
      confirmar: 'Apagar tudo',
      perigo: true,
      acao: () => {
        estoque.limparTudo();
        avisar('Todos os dados foram apagados.');
      },
    });
  }

  const confirmar = () => {
    const acao = pedido?.acao;
    setPedido(null);
    acao?.();
  };

  const verTodosRepor = () => {
    setFiltroStatus('repor');
    ir('produtos');
  };

  return (
    <>
      <a className="pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>
        Pular para o conteúdo
      </a>

      <header className="cabecalho">
        <div className="cabecalho-interno">
          <a className="marca" href="#painel" aria-label="Controle de Estoque, ir para o painel">
            <Logo />
            <span>Controle de Estoque</span>
          </a>
          <nav className="abas" aria-label="Seções">
            {ABAS.map(([id, rotulo]) => (
              <a key={id} href={`#${id}`} aria-current={rota === id ? 'page' : undefined}>
                {rotulo}
                {id === 'produtos' && qtdRepor > 0 && (
                  <span className="contador contador-alerta" aria-label={`${qtdRepor} para repor`}>{qtdRepor}</span>
                )}
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="btn-icone"
            onClick={alternarTema}
            aria-label={tema === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'}
            title={tema === 'escuro' ? 'Tema claro' : 'Tema escuro'}
          >
            {tema === 'escuro' ? <IconeSol /> : <IconeLua />}
          </button>
        </div>
      </header>

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        {!estoque.salvamentoOk && (
          <div className="faixa-aviso" role="alert">
            <IconeAviso />
            <span>Este navegador não está deixando salvar os dados (modo privado ou armazenamento cheio). Baixe um backup para não perder nada.</span>
          </div>
        )}

        {rota === 'painel' && (
          <Painel
            resumo={resumoGeral}
            produtos={produtos}
            serie={serie}
            movimentos={movimentos}
            gerandoPdf={gerandoPdf}
            aoNovoProduto={abrirNovoProduto}
            aoMovimentar={abrirMovimento}
            aoGerarPdf={gerarPdf}
            aoVerTodosRepor={verTodosRepor}
            aoVerMovimentos={() => ir('movimentos')}
            aoCarregarExemplo={pedirExemplo}
          />
        )}
        {rota === 'produtos' && (
          <Produtos
            produtos={produtos}
            categorias={categorias}
            status={filtroStatus}
            setStatus={setFiltroStatus}
            aoNovo={abrirNovoProduto}
            aoEditar={abrirEditar}
            aoExcluir={pedirExclusao}
            aoMovimentar={(id) => abrirMovimento(id, 'saida')}
          />
        )}
        {rota === 'movimentos' && (
          <Movimentos movimentos={movimentos} produtos={produtos} aoNova={() => abrirMovimento()} />
        )}
        {rota === 'dados' && (
          <Dados
            temDados={temDados}
            gerandoPdf={gerandoPdf}
            aoGerarPdf={gerarPdf}
            aoCsvProdutos={() => baixarCsv('produtos', csvProdutos(produtos))}
            aoCsvMovimentos={() => baixarCsv('movimentacoes', csvMovimentos(movimentos))}
            aoBackup={baixarBackup}
            aoRestaurar={restaurar}
            aoCarregarExemplo={pedirExemplo}
            aoLimpar={pedirLimpeza}
          />
        )}
      </main>

      <footer className="rodape">Seus dados ficam salvos apenas neste navegador.</footer>

      <ProdutoDialogo
        aberto={dialogoProduto.aberto}
        produto={dialogoProduto.produto}
        categorias={categorias}
        aoSalvar={salvarProduto}
        aoFechar={fecharProduto}
      />
      <MovimentoDialogo
        aberto={dialogoMov.aberto}
        produtos={produtos}
        inicial={dialogoMov.inicial}
        aoSalvar={salvarMovimento}
        aoFechar={fecharMovimento}
      />
      <Confirmacao pedido={pedido} aoCancelar={() => setPedido(null)} aoConfirmar={confirmar} />
      <Avisos avisos={avisos} />
    </>
  );
}
