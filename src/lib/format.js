const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const dataLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

export const formatarMoeda = (v) => moeda.format(v || 0);
export const formatarNumero = (v) => inteiro.format(v || 0);
export const formatarDataHora = (iso) => dataHora.format(new Date(iso));
export const formatarDataCurta = (d) => dataCurta.format(d);
export const formatarDataLonga = (d) => dataLonga.format(d);

export function baixarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sufixoData(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
