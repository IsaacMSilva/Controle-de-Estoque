import { useMemo, useState } from 'react';
import Nivel from '../components/Nivel.jsx';
import { SeloStatus } from '../components/Selo.jsx';
import { IconeBusca, IconeEditar, IconeLixeira, IconeMais } from '../components/Icones.jsx';
import { filtrarProdutos, ordenarProdutos, precisaRepor } from '../lib/estoque.js';
import { formatarMoeda, formatarNumero } from '../lib/format.js';

export default function Produtos({ produtos, categorias, status, setStatus, aoNovo, aoEditar, aoExcluir, aoMovimentar }) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ordem, setOrdem] = useState('nome');

  const contagem = useMemo(() => {
    const repor = produtos.filter(precisaRepor).length;
    return { todos: produtos.length, repor, ok: produtos.length - repor };
  }, [produtos]);

  const lista = useMemo(
    () => ordenarProdutos(filtrarProdutos(produtos, { busca, status, categoria }), ordem),
    [produtos, busca, status, categoria, ordem]
  );

  const filtrando = busca || categoria || status !== 'todos';

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>Produtos</h1>
          <p className="texto-suave">Saldo, nível e valor de cada item em estoque.</p>
        </div>
        <button type="button" className="btn" onClick={aoNovo}>
          <IconeMais /> Novo produto
        </button>
      </div>

      <section className="painel">
        <div className="barra-filtros">
          <div className="busca">
            <IconeBusca />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, SKU ou categoria"
              aria-label="Buscar produtos"
            />
          </div>
          <div className="fichas" role="group" aria-label="Filtrar por situação">
            {[
              ['todos', 'Todos', contagem.todos],
              ['repor', 'Repor', contagem.repor],
              ['ok', 'Em dia', contagem.ok],
            ].map(([valor, rotulo, n]) => (
              <button key={valor} type="button" className="ficha" aria-pressed={status === valor} onClick={() => setStatus(valor)}>
                {rotulo} <span className="ficha-n">{n}</span>
              </button>
            ))}
          </div>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Filtrar por categoria" disabled={categorias.length === 0}>
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar por">
            <option value="nome">Nome (A–Z)</option>
            <option value="urgencia">Mais urgentes primeiro</option>
            <option value="saldo">Menor saldo</option>
            <option value="valor">Maior valor em estoque</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </div>

        <div className="tabela-wrapper">
          <table className="tabela tabela-produtos">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Nível</th>
                <th className="num">Saldo</th>
                <th className="num">Mínimo</th>
                <th className="num">Valor</th>
                <th>Situação</th>
                <th><span className="so-leitor">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className={p.status !== 'ok' ? 'linha-alerta' : ''}>
                  <td data-label="Produto" className="celula-principal">
                    <strong>{p.nome}</strong>
                    {p.sku && <span className="texto-suave sku">{p.sku}</span>}
                    {p.categoria && <span className="texto-suave sku so-mobile">{p.categoria}</span>}
                  </td>
                  <td data-label="Categoria" className="col-categoria">{p.categoria || '—'}</td>
                  <td data-label="Nível" className="celula-nivel">
                    <Nivel saldo={p.saldo} minimo={p.estoqueMinimo} status={p.status} />
                  </td>
                  <td data-label="Saldo" className="num"><strong>{formatarNumero(p.saldo)}</strong></td>
                  <td data-label="Mínimo" className="num">{formatarNumero(p.estoqueMinimo)}</td>
                  <td data-label="Valor" className="num">{formatarMoeda(p.valorEmEstoque)}</td>
                  <td data-label="Situação"><SeloStatus status={p.status} /></td>
                  <td className="acoes">
                    <button type="button" className="btn btn-pequeno" onClick={() => aoMovimentar(p.id)}>
                      Movimentar
                    </button>
                    <button type="button" className="btn-icone" onClick={() => aoEditar(p)} aria-label={`Editar ${p.nome}`} title="Editar">
                      <IconeEditar />
                    </button>
                    <button type="button" className="btn-icone btn-icone-perigo" onClick={() => aoExcluir(p)} aria-label={`Excluir ${p.nome}`} title="Excluir">
                      <IconeLixeira />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && (
            <div className="vazio">
              {produtos.length === 0 ? (
                <>
                  <p>Nenhum produto cadastrado ainda.</p>
                  <button type="button" className="btn" onClick={aoNovo}>Cadastrar o primeiro produto</button>
                </>
              ) : (
                <p>Nenhum produto encontrado{filtrando ? ' com esses filtros' : ''}.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
