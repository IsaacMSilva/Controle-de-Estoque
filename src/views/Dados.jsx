import { useRef } from 'react';
import { IconeBaixar, IconeEnviar } from '../components/Icones.jsx';

export default function Dados({
  temDados,
  gerandoPdf,
  aoGerarPdf,
  aoCsvProdutos,
  aoCsvMovimentos,
  aoBackup,
  aoRestaurar,
  aoCarregarExemplo,
  aoLimpar,
}) {
  const arquivoRef = useRef(null);

  function aoEscolherArquivo(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (arquivo) aoRestaurar(arquivo);
  }

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>Dados e backup</h1>
          <p className="texto-suave">Relatórios, planilhas e cópia de segurança.</p>
        </div>
      </div>

      <div className="grade-dados">
        <section className="painel">
          <h2>Relatórios e planilhas</h2>
          <p className="texto-suave">O PDF traz saldo e situação de cada produto. Os arquivos CSV abrem no Excel e no Google Planilhas.</p>
          <div className="acoes-coluna">
            <button type="button" className="btn" onClick={aoGerarPdf} disabled={!temDados || gerandoPdf}>
              <IconeBaixar /> {gerandoPdf ? 'Gerando PDF…' : 'Baixar relatório em PDF'}
            </button>
            <button type="button" className="btn btn-neutro" onClick={aoCsvProdutos} disabled={!temDados}>
              <IconeBaixar /> Produtos em CSV
            </button>
            <button type="button" className="btn btn-neutro" onClick={aoCsvMovimentos} disabled={!temDados}>
              <IconeBaixar /> Movimentações em CSV
            </button>
          </div>
        </section>

        <section className="painel">
          <h2>Cópia de segurança</h2>
          <p className="texto-suave">
            Os dados ficam salvos só neste navegador. Baixe um backup de vez em quando e use-o para levar tudo para outro computador. Também dá para importar o <code>data.json</code> da versão antiga.
          </p>
          <div className="acoes-coluna">
            <button type="button" className="btn" onClick={aoBackup} disabled={!temDados}>
              <IconeBaixar /> Baixar backup (.json)
            </button>
            <button type="button" className="btn btn-neutro" onClick={() => arquivoRef.current?.click()}>
              <IconeEnviar /> Restaurar de um arquivo
            </button>
            <input ref={arquivoRef} type="file" accept="application/json,.json" onChange={aoEscolherArquivo} hidden />
          </div>
        </section>

        <section className="painel painel-largo">
          <h2>Começar do zero ou testar</h2>
          <p className="texto-suave">Estas ações substituem tudo o que está salvo agora e não dá para desfazer. Baixe um backup antes se tiver dúvida.</p>
          <div className="acoes-linha">
            <button type="button" className="btn btn-neutro" onClick={aoCarregarExemplo}>
              Carregar dados de exemplo
            </button>
            <button type="button" className="btn btn-perigo-suave" onClick={aoLimpar} disabled={!temDados}>
              Apagar todos os dados
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
