import { useMemo, useState } from 'react';
import { SeloTipo } from '../components/Selo.jsx';
import { IconeBusca, IconeMais } from '../components/Icones.jsx';
import { filtrarMovimentos } from '../lib/estoque.js';
import { formatarDataHora, formatarNumero } from '../lib/format.js';

const PASSO = 50;

export default function Movimentos({ movimentos, produtos, aoNova }) {
  const [tipo, setTipo] = useState('todos');
  const [produtoId, setProdutoId] = useState('');
  const [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(PASSO);

  const lista = useMemo(() => filtrarMovimentos(movimentos, { tipo, produtoId, busca }), [movimentos, tipo, produtoId, busca]);
  const mudar = (setter) => (valor) => {
    setter(valor);
    setLimite(PASSO);
  };

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>Histórico</h1>
          <p className="texto-suave">Todas as entradas e saídas, da mais recente para a mais antiga.</p>
        </div>
        <button type="button" className="btn" onClick={aoNova} disabled={produtos.length === 0}>
          <IconeMais /> Nova movimentação
        </button>
      </div>

      <section className="painel">
        <div className="barra-filtros">
          <div className="busca">
            <IconeBusca />
            <input type="search" value={busca} onChange={(e) => mudar(setBusca)(e.target.value)} placeholder="Buscar por produto ou observação" aria-label="Buscar movimentações" />
          </div>
          <div className="fichas" role="group" aria-label="Filtrar por tipo">
            {[
              ['todos', 'Todas'],
              ['entrada', 'Entradas'],
              ['saida', 'Saídas'],
            ].map(([valor, rotulo]) => (
              <button key={valor} type="button" className="ficha" aria-pressed={tipo === valor} onClick={() => mudar(setTipo)(valor)}>
                {rotulo}
              </button>
            ))}
          </div>
          <select value={produtoId} onChange={(e) => mudar(setProdutoId)(e.target.value)} aria-label="Filtrar por produto">
            <option value="">Todos os produtos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className="tabela-wrapper">
          <table className="tabela tabela-movimentos">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th className="num">Quantidade</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {lista.slice(0, limite).map((m) => (
                <tr key={m.id}>
                  <td data-label="Data"><time dateTime={m.data}>{formatarDataHora(m.data)}</time></td>
                  <td data-label="Produto" className="celula-principal"><strong>{m.produtoNome}</strong></td>
                  <td data-label="Tipo"><SeloTipo tipo={m.tipo} /></td>
                  <td data-label="Quantidade" className="num">{formatarNumero(m.quantidade)}</td>
                  <td data-label="Observação">{m.observacao || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && (
            <div className="vazio">
              <p>{movimentos.length === 0 ? 'Nenhuma movimentação ainda.' : 'Nenhuma movimentação com esses filtros.'}</p>
            </div>
          )}
        </div>

        {lista.length > limite && (
          <div className="mais">
            <button type="button" className="btn btn-neutro" onClick={() => setLimite((l) => l + PASSO)}>
              Mostrar mais ({formatarNumero(lista.length - limite)} restantes)
            </button>
          </div>
        )}
      </section>
    </>
  );
}
