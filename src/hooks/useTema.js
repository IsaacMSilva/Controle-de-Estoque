import { useCallback, useEffect, useState } from 'react';

const CHAVE = 'controle-estoque:tema';

function temaInicial() {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

export function useTema() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'escuro' ? '#0b1020' : '#eef0f4');
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const novo = atual === 'escuro' ? 'claro' : 'escuro';
      try {
        window.localStorage.setItem(CHAVE, novo);
      } catch {}
      return novo;
    });
  }, []);

  return [tema, alternar];
}
