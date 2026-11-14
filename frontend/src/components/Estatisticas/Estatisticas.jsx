import { useEffect, useState } from "react";
import NumeroQueSobe from "../NumeroQueSobe/NumeroQueSobe";
import { buscarEstatisticas } from "../../services/estatisticas";

// Os números do site, logo abaixo da apresentação da Home (ERS, escopo futuro 6.7).
// Se a API falhar, a faixa some: ela é um extra, e a Home funciona sem ela.
// Os cartões aparecem um depois do outro e os números contam do zero quando entram na tela
const formato = new Intl.NumberFormat("pt-BR");

function itens({ adocoes, animaisDisponiveis, abrigos }) {
  return [
    {
      chave: "adocoes",
      valor: adocoes,
      um: "adoção feita pelo site",
      varios: "adoções feitas pelo site",
    },
    {
      chave: "disponiveis",
      valor: animaisDisponiveis,
      um: "animal esperando um lar",
      varios: "animais esperando um lar",
    },
    {
      chave: "abrigos",
      valor: abrigos,
      um: "abrigo ou ONG cadastrado",
      varios: "abrigos e ONGs cadastrados",
    },
  ];
}

export default function Estatisticas() {
  const [numeros, setNumeros] = useState(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let cancelado = false;
    buscarEstatisticas()
      .then((resposta) => {
        if (!cancelado) setNumeros(resposta);
      })
      .catch(() => {
        if (!cancelado) setFalhou(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (falhou) return null;

  return (
    <section
      aria-labelledby="estatisticas-titulo"
      className="mx-auto w-full max-w-[1440px] px-5 pt-8 md:px-14"
    >
      <h2
        id="estatisticas-titulo"
        className="font-titulo text-overline font-semibold uppercase text-texto-secundario"
      >
        O Adota Aqui em números
      </h2>
      {/* Enquanto carrega, os cartões já ocupam o lugar: assim a vitrine não pula pra baixo */}
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:gap-3" aria-busy={!numeros}>
        {(numeros ? itens(numeros) : itens({})).map((item, posicao) => (
          <li
            key={item.chave}
            className="revelar-ao-rolar rounded-[16px] border border-borda-sutil bg-fundo-superficie px-3 py-3 sm:px-5 sm:py-4"
            style={{ "--ordem": posicao }}
          >
            {numeros ? (
              <>
                <p className="font-titulo text-secao font-semibold text-marca-roxo sm:text-display">
                  <NumeroQueSobe valor={item.valor} formatar={formato.format} />
                </p>
                <p className="mt-1 text-legenda text-texto-secundario sm:text-compacto">
                  {item.valor === 1 ? item.um : item.varios}
                </p>
              </>
            ) : (
              <div aria-hidden="true">
                <div className="h-7 w-12 animate-pulse rounded-[8px] bg-marca-roxo-suave sm:h-9 sm:w-16" />
                <div className="mt-2 h-4 w-full max-w-40 animate-pulse rounded-[6px] bg-marca-roxo-suave" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
