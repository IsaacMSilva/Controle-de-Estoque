export function Campo({ id, rotulo, erro, ajuda, children, obrigatorio = false }) {
  return (
    <div className={`campo ${erro ? 'campo-erro' : ''}`}>
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && <span className="obrigatorio" aria-hidden="true"> *</span>}
      </label>
      {children}
      {erro ? (
        <p className="campo-msg campo-msg-erro" id={`${id}-msg`}>{erro}</p>
      ) : ajuda ? (
        <p className="campo-msg" id={`${id}-msg`}>{ajuda}</p>
      ) : null}
    </div>
  );
}

export function ariaCampo(id, erro, ajuda) {
  return {
    id,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': erro || ajuda ? `${id}-msg` : undefined,
  };
}
