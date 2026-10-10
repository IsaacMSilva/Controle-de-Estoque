import Dialogo from './Dialogo.jsx';

export default function Confirmacao({ pedido, aoCancelar, aoConfirmar }) {
  return (
    <Dialogo
      aberto={Boolean(pedido)}
      aoFechar={aoCancelar}
      titulo={pedido?.titulo || ''}
      largura="pequena"
      rodape={
        <>
          <button type="button" className="btn btn-neutro" onClick={aoCancelar}>
            Cancelar
          </button>
          <button type="button" className={`btn ${pedido?.perigo ? 'btn-perigo' : ''}`} onClick={aoConfirmar} autoFocus>
            {pedido?.confirmar || 'Confirmar'}
          </button>
        </>
      }
    >
      <p className="dialogo-texto">{pedido?.mensagem}</p>
    </Dialogo>
  );
}
