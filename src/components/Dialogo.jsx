import { useEffect, useRef } from 'react';
import { IconeFechar } from './Icones.jsx';

export default function Dialogo({ aberto, aoFechar, titulo, descricao, children, rodape, largura = 'media' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  }, [aberto]);

  function aoClicarNoFundo(e) {
    if (e.target === ref.current) aoFechar();
  }

  return (
    <dialog
      ref={ref}
      className={`dialogo dialogo-${largura}`}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      onMouseDown={aoClicarNoFundo}
      aria-labelledby="dialogo-titulo"
    >
      {aberto && (
        <div className="dialogo-corpo">
          <header className="dialogo-topo">
            <div>
              <h2 id="dialogo-titulo">{titulo}</h2>
              {descricao && <p className="texto-suave">{descricao}</p>}
            </div>
            <button type="button" className="btn-icone" onClick={aoFechar} aria-label="Fechar">
              <IconeFechar />
            </button>
          </header>
          {children}
          {rodape && <footer className="dialogo-rodape">{rodape}</footer>}
        </div>
      )}
    </dialog>
  );
}
