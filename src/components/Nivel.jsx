export default function Nivel({ saldo, minimo, status }) {
  const escala = Math.max(minimo * 2, saldo, 1);
  const preenchido = Math.min(100, (Math.max(saldo, 0) / escala) * 100);
  const marca = minimo > 0 ? Math.min(100, (minimo / escala) * 100) : null;

  return (
    <span className="nivel" aria-hidden="true">
      <span className={`nivel-preenchido nivel-${status}`} style={{ width: `${preenchido}%` }} />
      {marca !== null && <span className="nivel-marca" style={{ left: `${marca}%` }} />}
    </span>
  );
}
