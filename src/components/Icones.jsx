const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export const IconeMais = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconeEditar = (p) => (
  <svg {...base} {...p}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="m14 7 3 3" /></svg>
);
export const IconeLixeira = (p) => (
  <svg {...base} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" /></svg>
);
export const IconeBaixar = (p) => (
  <svg {...base} {...p}><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg>
);
export const IconeEnviar = (p) => (
  <svg {...base} {...p}><path d="M12 16V5m0 0-4 4m4-4 4 4M5 20h14" /></svg>
);
export const IconeLua = (p) => (
  <svg {...base} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
);
export const IconeSol = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IconeSetas = (p) => (
  <svg {...base} {...p}><path d="M7 4v14m0 0-3-3m3 3 3-3M17 20V6m0 0-3 3m3-3 3 3" /></svg>
);
export const IconeOk = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.6 2.6L16 9.5" /></svg>
);
export const IconeAviso = (p) => (
  <svg {...base} {...p}><path d="M12 3 2.5 20h19L12 3z" /><path d="M12 10v4.5M12 17.5v.01" /></svg>
);
export const IconeFechar = (p) => (
  <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const IconeBusca = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
);

export function Logo({ tamanho = 28 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--primario)" />
      <path d="M7 12.5 16 8l9 4.5v8L16 25l-9-4.5v-8z" fill="none" stroke="var(--sobre-primario)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 12.5 16 17l9-4.5M16 17v8" fill="none" stroke="var(--sobre-primario)" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
