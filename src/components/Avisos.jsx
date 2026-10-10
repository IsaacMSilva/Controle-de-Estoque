import { IconeAviso, IconeOk } from './Icones.jsx';

export default function Avisos({ avisos }) {
  return (
    <div className="avisos" role="status" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className={`aviso aviso-${a.tipo}`}>
          {a.tipo === 'erro' ? <IconeAviso /> : <IconeOk />}
          <span>{a.texto}</span>
        </div>
      ))}
    </div>
  );
}
