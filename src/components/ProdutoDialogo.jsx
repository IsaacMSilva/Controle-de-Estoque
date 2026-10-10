import { useState } from 'react';
import Dialogo from './Dialogo.jsx';
import { Campo, ariaCampo } from './Campo.jsx';

const VAZIO = { nome: '', sku: '', categoria: '', preco: '', estoqueMinimo: '0', estoqueInicial: '' };

function Formulario({ produto, categorias, aoSalvar, aoFechar }) {
  const editando = Boolean(produto);
  const [form, setForm] = useState(
    editando
      ? {
          nome: produto.nome,
          sku: produto.sku,
          categoria: produto.categoria,
          preco: produto.preco ? String(produto.preco) : '',
          estoqueMinimo: String(produto.estoqueMinimo),
          estoqueInicial: '',
        }
      : VAZIO
  );
  const [erros, setErros] = useState({});

  const mudar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    if (erros[campo]) setErros((x) => ({ ...x, [campo]: undefined }));
  };

  function enviar(e) {
    e.preventDefault();
    const resultado = aoSalvar(form);
    if (!resultado.ok) setErros(resultado.erros);
  }

  return (
    <form onSubmit={enviar} noValidate className="formulario" id="form-produto">
      <Campo id="p-nome" rotulo="Nome" obrigatorio erro={erros.nome}>
        <input {...ariaCampo('p-nome', erros.nome)} value={form.nome} onChange={mudar('nome')} placeholder="Ex.: Camiseta básica preta M" autoFocus autoComplete="off" maxLength={80} />
      </Campo>

      <div className="linha-dupla">
        <Campo id="p-sku" rotulo="SKU ou código" erro={erros.sku}>
          <input {...ariaCampo('p-sku', erros.sku)} value={form.sku} onChange={mudar('sku')} placeholder="Ex.: CAM-PRT-M" autoComplete="off" maxLength={40} />
        </Campo>
        <Campo id="p-categoria" rotulo="Categoria" erro={erros.categoria}>
          <input {...ariaCampo('p-categoria', erros.categoria)} list="lista-categorias" value={form.categoria} onChange={mudar('categoria')} placeholder="Ex.: Vestuário" autoComplete="off" maxLength={40} />
          <datalist id="lista-categorias">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Campo>
      </div>

      <div className="linha-dupla">
        <Campo id="p-preco" rotulo="Preço unitário (R$)" erro={erros.preco} ajuda="Usado para calcular o valor em estoque.">
          <input {...ariaCampo('p-preco', erros.preco, true)} type="number" inputMode="decimal" min="0" step="0.01" value={form.preco} onChange={mudar('preco')} placeholder="0,00" />
        </Campo>
        <Campo id="p-minimo" rotulo="Estoque mínimo" erro={erros.estoqueMinimo} ajuda="Abaixo disso, o produto entra em reposição.">
          <input {...ariaCampo('p-minimo', erros.estoqueMinimo, true)} type="number" inputMode="numeric" min="0" step="1" value={form.estoqueMinimo} onChange={mudar('estoqueMinimo')} />
        </Campo>
      </div>

      {!editando && (
        <Campo id="p-inicial" rotulo="Quantidade em estoque agora" erro={erros.estoqueInicial} ajuda="Opcional. Cria uma entrada de estoque inicial.">
          <input {...ariaCampo('p-inicial', erros.estoqueInicial, true)} type="number" inputMode="numeric" min="0" step="1" value={form.estoqueInicial} onChange={mudar('estoqueInicial')} placeholder="0" />
        </Campo>
      )}

      <div className="dialogo-rodape">
        <button type="button" className="btn btn-neutro" onClick={aoFechar}>
          Cancelar
        </button>
        <button type="submit" className="btn">
          {editando ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
      </div>
    </form>
  );
}

export default function ProdutoDialogo({ aberto, produto, categorias, aoSalvar, aoFechar }) {
  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={produto ? 'Editar produto' : 'Novo produto'}
      descricao={produto ? 'O saldo muda só com entradas e saídas.' : 'Cadastre o produto e, se quiser, o que já tem em estoque.'}
    >
      <Formulario produto={produto} categorias={categorias} aoSalvar={aoSalvar} aoFechar={aoFechar} />
    </Dialogo>
  );
}
