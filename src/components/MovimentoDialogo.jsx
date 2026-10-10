import { useState } from 'react';
import Dialogo from './Dialogo.jsx';
import { Campo, ariaCampo } from './Campo.jsx';
import { formatarNumero } from '../lib/format.js';

function Formulario({ produtos, inicial, aoSalvar, aoFechar }) {
  const [form, setForm] = useState({
    produtoId: inicial.produtoId || '',
    tipo: inicial.tipo || 'entrada',
    quantidade: '',
    observacao: '',
  });
  const [erros, setErros] = useState({});

  const produto = produtos.find((p) => p.id === form.produtoId);
  const quantidade = Number(form.quantidade);
  const quantidadeValida = Number.isInteger(quantidade) && quantidade > 0;
  const excede = produto && form.tipo === 'saida' && quantidadeValida && quantidade > produto.saldo;
  const saldoDepois =
    produto && quantidadeValida && !excede ? produto.saldo + (form.tipo === 'entrada' ? quantidade : -quantidade) : null;

  const mudar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    if (erros[campo]) setErros((x) => ({ ...x, [campo]: undefined }));
  };

  function enviar(e) {
    e.preventDefault();
    const resultado = aoSalvar(form);
    if (!resultado.ok) setErros(resultado.erros);
  }

  const erroQuantidade = erros.quantidade || (excede ? `Saldo insuficiente. Disponível: ${formatarNumero(produto.saldo)}.` : '');

  return (
    <form onSubmit={enviar} noValidate className="formulario">
      <Campo id="m-produto" rotulo="Produto" obrigatorio erro={erros.produtoId}>
        <select {...ariaCampo('m-produto', erros.produtoId)} value={form.produtoId} onChange={mudar('produtoId')} autoFocus={!inicial.produtoId}>
          <option value="">Selecione um produto</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} (saldo: {formatarNumero(p.saldo)})
            </option>
          ))}
        </select>
      </Campo>

      <fieldset className="segmentado" aria-label="Tipo de movimentação">
        <label className={form.tipo === 'entrada' ? 'ativo ativo-entrada' : ''}>
          <input type="radio" name="tipo" value="entrada" checked={form.tipo === 'entrada'} onChange={mudar('tipo')} />
          Entrada
        </label>
        <label className={form.tipo === 'saida' ? 'ativo ativo-saida' : ''}>
          <input type="radio" name="tipo" value="saida" checked={form.tipo === 'saida'} onChange={mudar('tipo')} />
          Saída
        </label>
      </fieldset>

      <Campo
        id="m-quantidade"
        rotulo="Quantidade"
        obrigatorio
        erro={erroQuantidade}
        ajuda={saldoDepois !== null ? `Saldo: ${formatarNumero(produto.saldo)} → ${formatarNumero(saldoDepois)}` : produto ? `Saldo atual: ${formatarNumero(produto.saldo)}` : ''}
      >
        <input
          {...ariaCampo('m-quantidade', erroQuantidade, saldoDepois !== null || Boolean(produto))}
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={form.quantidade}
          onChange={mudar('quantidade')}
          autoFocus={Boolean(inicial.produtoId)}
        />
      </Campo>

      <Campo id="m-obs" rotulo="Observação" erro={erros.observacao}>
        <input {...ariaCampo('m-obs', erros.observacao)} value={form.observacao} onChange={mudar('observacao')} placeholder="Ex.: Nota fiscal 1234" autoComplete="off" maxLength={140} />
      </Campo>

      <div className="dialogo-rodape">
        <button type="button" className="btn btn-neutro" onClick={aoFechar}>
          Cancelar
        </button>
        <button type="submit" className="btn" disabled={Boolean(excede)}>
          {form.tipo === 'entrada' ? 'Registrar entrada' : 'Registrar saída'}
        </button>
      </div>
    </form>
  );
}

export default function MovimentoDialogo({ aberto, produtos, inicial, aoSalvar, aoFechar }) {
  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo="Registrar movimentação" descricao="Entradas somam ao saldo e saídas descontam dele.">
      <Formulario produtos={produtos} inicial={inicial || {}} aoSalvar={aoSalvar} aoFechar={aoFechar} />
    </Dialogo>
  );
}
