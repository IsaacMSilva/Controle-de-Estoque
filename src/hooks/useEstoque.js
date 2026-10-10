import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHAVE_STORAGE,
  carregarDados,
  criarProduto,
  dadosExemplo,
  dadosVazios,
  editarProduto,
  registrarMovimento,
  removerProduto,
} from '../lib/estoque.js';

function lerStorage() {
  try {
    return { texto: window.localStorage.getItem(CHAVE_STORAGE), disponivel: true };
  } catch {
    return { texto: null, disponivel: false };
  }
}

export function useEstoque() {
  const [dados, setDados] = useState(() => carregarDados(lerStorage().texto));
  const [salvamentoOk, setSalvamentoOk] = useState(() => lerStorage().disponivel);
  const dadosRef = useRef(dados);
  dadosRef.current = dados;

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
      setSalvamentoOk(true);
    } catch {
      setSalvamentoOk(false);
    }
  }, [dados]);

  useEffect(() => {
    function aoMudar(e) {
      if (e.key === CHAVE_STORAGE) setDados(carregarDados(e.newValue));
    }
    window.addEventListener('storage', aoMudar);
    return () => window.removeEventListener('storage', aoMudar);
  }, []);

  const aplicar = useCallback((operacao) => {
    const resultado = operacao(dadosRef.current);
    if (resultado.ok) {
      dadosRef.current = resultado.dados;
      setDados(resultado.dados);
    }
    return resultado;
  }, []);

  return {
    dados,
    salvamentoOk,
    criarProduto: useCallback((entrada) => aplicar((d) => criarProduto(d, entrada)), [aplicar]),
    editarProduto: useCallback((id, entrada) => aplicar((d) => editarProduto(d, id, entrada)), [aplicar]),
    removerProduto: useCallback((id) => aplicar((d) => removerProduto(d, id)), [aplicar]),
    registrarMovimento: useCallback((entrada) => aplicar((d) => registrarMovimento(d, entrada)), [aplicar]),
    substituirDados: useCallback((novos) => aplicar(() => ({ ok: true, dados: novos })), [aplicar]),
    carregarExemplo: useCallback(() => aplicar(() => ({ ok: true, dados: dadosExemplo() })), [aplicar]),
    limparTudo: useCallback(() => aplicar(() => ({ ok: true, dados: dadosVazios() })), [aplicar]),
  };
}
