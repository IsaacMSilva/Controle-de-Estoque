import Grafico from '../components/Grafico.jsx';
import Nivel from '../components/Nivel.jsx';
import { SeloTipo } from '../components/Selo.jsx';
import { IconeBaixar, IconeMais, IconeOk } from '../components/Icones.jsx';
import { formatarDataHora, formatarDataLonga, formatarMoeda, formatarNumero } from '../lib/format.js';

export default function Painel({
  resumo,
  produtos,
  serie,
  movimentos,
  gerandoPdf,
  aoNovoProduto,
  aoMovimentar,
  aoGerarPdf,
  aoVerTodosRepor,
  aoVerMovimentos,
  aoCarregarExemplo,
}) {
  const repor = produtos
    .filter((p) => p.status !== 'ok')
    .sort((a, b) => (a.status === 'zerado' ? -1 : 0) - (b.status === 'zerado' ? -1 : 0) || a.saldo / (a.estoqueMinimo || 1) - b.saldo / (b.estoqueMinimo || 1));
  const visiveis = repor.slice(0, 6);

  if (produtos.length === 0) {
    return (
      <div className="vazio-inicial">
        <h1>Comece pelo primeiro produto</h1>
        <p>
          Cadastre o que você vende ou guarda, registre entradas e saídas e o painel mostra o que está acabando. Tudo fica salvo neste navegador.
        </p>
        <div className="acoes-linha">
          <button type="button" className="btn" onClick={aoNovoProduto}>
            <IconeMais /> Cadastrar produto
          </button>
          <button type="button" className="btn btn-neutro" onClick={aoCarregarExemplo}>
            Ver com dados de exemplo
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>Painel</h1>
          <p className="texto-suave primeira-maiuscula">{formatarDataLonga(new Date())}</p>
        </div>
        <div className="acoes-linha">
          <button type="button" className="btn btn-neutro" onClick={aoGerarPdf} disabled={gerandoPdf}>
            <IconeBaixar /> {gerandoPdf ? 'Gerando PDF…' : 'Relatório em PDF'}
          </button>
          <button type="button" className="btn" onClick={aoNovoProduto}>
            <IconeMais /> Novo produto
          </button>
        </div>
      </div>

      <dl className="resumo">
        <div>
          <dt>Produtos</dt>
          <dd>{formatarNumero(resumo.totalProdutos)}</dd>
        </div>
        <div>
          <dt>Unidades em estoque</dt>
          <dd>{formatarNumero(resumo.unidades)}</dd>
        </div>
        <div>
          <dt>Valor em estoque</dt>
          <dd>{formatarMoeda(resumo.valorEmEstoque)}</dd>
        </div>
        <div>
          <dt>Movimentações em 7 dias</dt>
          <dd>{formatarNumero(resumo.movimentos7dias)}</dd>
        </div>
      </dl>

      <div className="grade-painel">
        <section className="painel" aria-labelledby="titulo-repor">
          <div className="painel-topo">
            <h2 id="titulo-repor">
              Precisa repor
              {repor.length > 0 && <span className="contador contador-alerta">{repor.length}</span>}
            </h2>
            {repor.length > visiveis.length && (
              <button type="button" className="link-botao" onClick={aoVerTodosRepor}>
                Ver todos
              </button>
            )}
          </div>

          {repor.length === 0 ? (
            <p className="tudo-certo">
              <IconeOk /> Nenhum produto abaixo do mínimo. Tudo em dia.
            </p>
          ) : (
            <ul className="lista-repor">
              {visiveis.map((p) => (
                <li key={p.id}>
                  <div className="lista-repor-nome">
                    <strong>{p.nome}</strong>
                    <span className="texto-suave">
                      {p.status === 'zerado' ? 'Sem estoque' : `${formatarNumero(p.saldo)} em estoque`}, mínimo {formatarNumero(p.estoqueMinimo)}
                    </span>
                  </div>
                  <Nivel saldo={p.saldo} minimo={p.estoqueMinimo} status={p.status} />
                  <button type="button" className="btn btn-pequeno" onClick={() => aoMovimentar(p.id, 'entrada')}>
                    Registrar entrada
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="painel" aria-labelledby="titulo-grafico">
          <h2 id="titulo-grafico">Últimos 14 dias</h2>
          <div className="legenda">
            <span><i className="legenda-cor legenda-entrada" /> Entradas</span>
            <span><i className="legenda-cor legenda-saida" /> Saídas</span>
          </div>
          <Grafico serie={serie} />
        </section>
      </div>

      <section className="painel" aria-labelledby="titulo-recentes">
        <div className="painel-topo">
          <h2 id="titulo-recentes">Últimas movimentações</h2>
          <button type="button" className="link-botao" onClick={aoVerMovimentos}>
            Ver histórico
          </button>
        </div>
        {movimentos.length === 0 ? (
          <p className="texto-suave">Nenhuma movimentação ainda. Registre a primeira entrada ou saída.</p>
        ) : (
          <ul className="lista-recentes">
            {movimentos.slice(0, 5).map((m) => (
              <li key={m.id}>
                <SeloTipo tipo={m.tipo} />
                <span className="lista-recentes-produto">
                  <strong>{formatarNumero(m.quantidade)}</strong> × {m.produtoNome}
                  {m.observacao && <span className="texto-suave obs">{m.observacao}</span>}
                </span>
                <time className="texto-suave" dateTime={m.data}>{formatarDataHora(m.data)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
