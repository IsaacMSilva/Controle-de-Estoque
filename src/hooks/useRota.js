import { useCallback, useEffect, useState } from 'react';

export const ROTAS = ['painel', 'produtos', 'movimentos', 'dados'];

function rotaAtual() {
  const h = window.location.hash.replace('#', '');
  return ROTAS.includes(h) ? h : 'painel';
}

export function useRota() {
  const [rota, setRota] = useState(rotaAtual);

  useEffect(() => {
    const aoMudar = () => setRota(rotaAtual());
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  const ir = useCallback((destino) => {
    window.location.hash = destino;
  }, []);

  return [rota, ir];
}
