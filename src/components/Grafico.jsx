import { formatarDataCurta, formatarNumero } from '../lib/format.js';

function tetoBonito(valor) {
  if (valor <= 5) return 5;
  const base = 10 ** Math.floor(Math.log10(valor));
  return Math.ceil(valor / base) * base;
}

export default function Grafico({ serie }) {
  const L = 560;
  const A = 230;
  const margem = { esq: 34, dir: 8, topo: 10, base: 26 };
  const larguraUtil = L - margem.esq - margem.dir;
  const alturaUtil = A - margem.topo - margem.base;
  const maximo = tetoBonito(Math.max(...serie.flatMap((d) => [d.entradas, d.saidas]), 0));
  const passo = larguraUtil / serie.length;
  const larguraBarra = Math.min(11, passo / 2 - 2);
  const y = (v) => margem.topo + alturaUtil - (v / maximo) * alturaUtil;

  const totalEntradas = serie.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = serie.reduce((s, d) => s + d.saidas, 0);
  const guias = [0, 0.5, 1].map((f) => Math.round(maximo * f));

  return (
    <svg
      className="grafico"
      viewBox={`0 0 ${L} ${A}`}
      role="img"
      aria-label={`Últimos ${serie.length} dias: ${formatarNumero(totalEntradas)} unidades entraram e ${formatarNumero(totalSaidas)} saíram.`}
    >
      {guias.map((g) => (
        <g key={g}>
          <line className="grafico-guia" x1={margem.esq} x2={L - margem.dir} y1={y(g)} y2={y(g)} />
          <text className="grafico-texto" x={margem.esq - 6} y={y(g) + 4} textAnchor="end">
            {g}
          </text>
        </g>
      ))}
      {serie.map((d, i) => {
        const x = margem.esq + i * passo + passo / 2;
        const rotulo = (serie.length - 1 - i) % 2 === 0;
        return (
          <g key={d.chave}>
            <title>{`${formatarDataCurta(d.data)}: ${d.entradas} entraram, ${d.saidas} saíram`}</title>
            {d.entradas > 0 && (
              <rect className="barra-entrada" x={x - larguraBarra - 1} y={y(d.entradas)} width={larguraBarra} height={y(0) - y(d.entradas)} rx="2" />
            )}
            {d.saidas > 0 && (
              <rect className="barra-saida" x={x + 1} y={y(d.saidas)} width={larguraBarra} height={y(0) - y(d.saidas)} rx="2" />
            )}
            {rotulo && (
              <text className="grafico-texto" x={x} y={A - 8} textAnchor="middle">
                {formatarDataCurta(d.data)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
