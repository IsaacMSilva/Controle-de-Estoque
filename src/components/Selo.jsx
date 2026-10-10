import { textoStatus } from '../lib/estoque.js';

export function SeloStatus({ status }) {
  return <span className={`selo selo-${status}`}>{textoStatus(status)}</span>;
}

export function SeloTipo({ tipo }) {
  return <span className={`selo selo-${tipo}`}>{tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>;
}
