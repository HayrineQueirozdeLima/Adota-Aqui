import { useEffect, useState } from "react";
import Botao from "../../components/Botao/Botao";
import Chip from "../../components/Chip/Chip";
import MapaDoBrasil, { LegendaDoMapa } from "../../components/MapaDoBrasil/MapaDoBrasil";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { buscarEstatisticasPorEstado } from "../../services/estatisticas";
import {
  fonteDosLares,
  laresComPet,
  medidas,
  porcentagem,
  ranking,
  tomDoValor,
  valoresDaMedida,
} from "../../utils/observatorio";
import { estados } from "../../utils/rotulos";

// Números públicos sobre cães e gatos no Brasil, cada um com a fonte e a data.
// Ficam fixos aqui porque nenhuma dessas fontes tem uma API simples
const retrato = [
  {
    numero: "46,1%",
    texto: "dos lares brasileiros têm pelo menos um cachorro, e 19,3% têm gato",
    fonte: "IBGE, Pesquisa Nacional de Saúde 2019",
    link: fonteDosLares.link,
  },
  {
    numero: "4,8 milhões",
    texto: "de cães e gatos vivem em situação de vulnerabilidade no Brasil",
    fonte: "Instituto Pet Brasil, 2024, na CNN Brasil",
    link: "https://www.cnnbrasil.com.br/nacional/quase-5-milhoes-de-pets-estao-em-situacao-de-vulnerabilidade-no-brasil/",
  },
  {
    numero: "201 mil",
    texto: "animais estão sob os cuidados de ONGs e protetores independentes",
    fonte: "Instituto Pet Brasil, 2024, na CNN Brasil",
    link: "https://www.cnnbrasil.com.br/nacional/quase-5-milhoes-de-pets-estao-em-situacao-de-vulnerabilidade-no-brasil/",
  },
  {
    numero: "675.855",
    texto: "castrações gratuitas pelo programa federal ProPatinhas até o fim de 2025",
    fonte: "Governo Federal, divulgado em abril de 2026, no O Povo",
    link: "https://www.opovo.com.br/noticias/ceara/2026/04/18/de-mel-a-simba-os-nomes-favoritos-dos-pets-no-ceara.html",
  },
];

const estiloDoLink =
  "rounded-sm underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo";

// Observatório da adoção, em /observatorio. Aberta pra qualquer pessoa.
// O mapa mostra, estado por estado, os números do próprio Adota Aqui (da API, ao vivo)
// ou a porcentagem dos lares com cachorro e com gato (IBGE). Embaixo, números do Brasil com fonte
export default function Observatorio() {
  const [porEstado, setPorEstado] = useState(null);
  // "carregando" | "pronto" | "erro"
  const [situacao, setSituacao] = useState("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [medidaId, setMedidaId] = useState("animaisDisponiveis");
  const [selecionado, setSelecionado] = useState(null);
  useTituloDaPagina("Observatório da adoção");

  useEffect(() => {
    let cancelado = false;
    setSituacao("carregando");
    buscarEstatisticasPorEstado()
      .then((lista) => {
        if (cancelado) return;
        setPorEstado(lista);
        setSituacao("pronto");
      })
      .catch(() => {
        if (!cancelado) setSituacao("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  const medida = medidas.find((opcao) => opcao.id === medidaId);
  const dadosDoSite = situacao === "pronto";
  // Os números do site precisam da API. Os do IBGE estão sempre aqui
  const valores = medida.doSite ? (dadosDoSite ? valoresDaMedida(medida, porEstado) : null) : valoresDaMedida(medida);
  const numeros = valores ? Object.values(valores) : [];
  const escala = medida.doSite
    ? { minimo: 0, maximo: Math.max(0, ...numeros) }
    : { minimo: Math.min(...numeros), maximo: Math.max(...numeros) };
  const formatar = (valor) => (medida.doSite ? valor.toLocaleString("pt-BR") : porcentagem(valor));
  const lista = valores ? ranking(valores).slice(0, 5) : [];
  const esperandoAgora = dadosDoSite
    ? porEstado.reduce((soma, linha) => soma + linha.animaisDisponiveis, 0)
    : null;

  function escolherMedida(id) {
    setMedidaId(id);
  }

  function grupoDeMedidas(titulo, doSite) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-titulo text-overline font-semibold uppercase text-texto-terciario">{titulo}</p>
        <div className="flex flex-wrap gap-2">
          {medidas
            .filter((opcao) => opcao.doSite === doSite)
            .map((opcao) => (
              <Chip key={opcao.id} ativo={medidaId === opcao.id} onClick={() => escolherMedida(opcao.id)}>
                {opcao.nome}
              </Chip>
            ))}
        </div>
      </div>
    );
  }

  function mostrarMapa() {
    if (!valores) {
      if (situacao === "erro") {
        return (
          <div role="alert" className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-8 text-center">
            <p className="font-titulo text-item font-semibold text-texto-principal">
              Não foi possível carregar os números do Adota Aqui.
            </p>
            <p className="mt-1 text-compacto text-texto-secundario">
              Os números do IBGE continuam aqui. Tente de novo em instantes.
            </p>
            <Botao variante="secundario" onClick={() => setTentativa((atual) => atual + 1)} className="mt-4">
              Tentar de novo
            </Botao>
          </div>
        );
      }
      return <p className="py-16 text-center text-compacto text-texto-secundario">Carregando os números...</p>;
    }
    return (
      <>
        <MapaDoBrasil
          valores={valores}
          medida={medida}
          tomDe={(valor) => tomDoValor(valor, escala)}
          formatar={formatar}
          selecionado={selecionado}
          aoSelecionar={setSelecionado}
        />
        <div className="mt-4 flex flex-col gap-2">
          <LegendaDoMapa comNenhum={medida.doSite} />
          <p className="text-legenda text-texto-terciario">
            {medida.doSite ? (
              "Fonte: o banco do Adota Aqui, agora. Animais e adoções contam onde o animal está; abrigos, o endereço do abrigo."
            ) : (
              <>
                Fonte:{" "}
                <a href={fonteDosLares.link} target="_blank" rel="noreferrer" className={estiloDoLink}>
                  {fonteDosLares.texto}
                  <span className="sr-only"> (abre em outra aba)</span>
                </a>
                , com os estados{" "}
                <a href={fonteDosLares.porEstado} target="_blank" rel="noreferrer" className={estiloDoLink}>
                  compilados pelo Panorama PetVet
                  <span className="sr-only"> (abre em outra aba)</span>
                </a>
                .
              </>
            )}
          </p>
        </div>
      </>
    );
  }

  function numerosDoEstado(sigla) {
    const doSite = dadosDoSite ? porEstado.find((linha) => linha.estado === sigla) : null;
    const lares = laresComPet[sigla];
    return (
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        {doSite &&
          medidas
            .filter((opcao) => opcao.doSite)
            .map((opcao) => (
              <div key={opcao.id}>
                <dt className="text-legenda text-texto-terciario">{opcao.nome}</dt>
                <dd className="font-titulo text-subtitulo font-semibold text-texto-principal">
                  {doSite[opcao.id].toLocaleString("pt-BR")}
                </dd>
              </div>
            ))}
        <div>
          <dt className="text-legenda text-texto-terciario">Lares com cachorro</dt>
          <dd className="font-titulo text-subtitulo font-semibold text-texto-principal">{porcentagem(lares.cachorro)}</dd>
        </div>
        <div>
          <dt className="text-legenda text-texto-terciario">Lares com gato</dt>
          <dd className="font-titulo text-subtitulo font-semibold text-texto-principal">{porcentagem(lares.gato)}</dd>
        </div>
      </dl>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-5 pb-14 pt-6 md:px-14 md:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[720px]">
          <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
            Observatório da adoção
          </h1>
          <p className="mt-2 text-corpo text-texto-secundario">
            Os números do Adota Aqui estado por estado, ao vivo, e o que os dados públicos contam sobre cães e
            gatos no Brasil. Cada número tem a fonte do lado.
          </p>
        </div>
        {esperandoAgora !== null && (
          <p className="flex items-baseline gap-3">
            <span className="font-titulo text-[44px] font-semibold leading-none text-marca-roxo">
              {esperandoAgora.toLocaleString("pt-BR")}
            </span>
            <span className="max-w-[180px] text-compacto text-texto-secundario">
              {esperandoAgora === 1 ? "animal esperando um lar agora" : "animais esperando um lar agora"}
            </span>
          </p>
        )}
      </div>

      <section aria-labelledby="mapa-titulo" className="flex flex-col gap-5">
        <h2 id="mapa-titulo" className="font-titulo text-secao font-semibold text-texto-principal">
          Estado por estado
        </h2>
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {grupoDeMedidas("No Adota Aqui", true)}
          {grupoDeMedidas("No Brasil, IBGE 2019", false)}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-start">
          <div className="w-full max-w-[440px]">{mostrarMapa()}</div>

          <div className="flex flex-col gap-5">
            <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
              {selecionado ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-titulo text-card font-semibold text-texto-principal">{estados[selecionado]}</h3>
                    <button
                      type="button"
                      onClick={() => setSelecionado(null)}
                      className="rounded-sm text-compacto font-semibold text-marca-roxo underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-roxo"
                    >
                      Ver o Brasil
                    </button>
                  </div>
                  {numerosDoEstado(selecionado)}
                </>
              ) : (
                <>
                  <h3 className="font-titulo text-card font-semibold text-texto-principal">Brasil</h3>
                  <p className="mt-1 text-compacto text-texto-secundario">
                    Toque num estado do mapa pra ver os números dele.
                  </p>
                  <p className="mt-3 text-compacto text-texto-principal">
                    46,1% dos lares têm cachorro e 19,3% têm gato (IBGE, 2019).
                  </p>
                </>
              )}
            </div>

            <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
              <h3 className="font-titulo text-item font-semibold text-texto-principal">
                Onde tem mais: {medida.nome.toLowerCase()}
              </h3>
              {valores && lista.length === 0 && (
                <p className="mt-2 text-compacto text-texto-secundario">Ainda não tem nenhum estado com esse número.</p>
              )}
              {lista.length > 0 && (
                <ol className="mt-3 flex flex-col gap-2.5">
                  {lista.map(([sigla, valor], posicao) => (
                    <li key={sigla} className="grid grid-cols-[1.5rem_minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-2">
                      <span className="text-legenda text-texto-terciario">{posicao + 1}º</span>
                      <span className="truncate text-compacto text-texto-principal">{estados[sigla]}</span>
                      <span aria-hidden="true" className="h-2 rounded-full bg-[var(--mapa-1)]">
                        <span
                          className="block h-2 rounded-full bg-[var(--mapa-4)]"
                          style={{ width: `${Math.max(4, (valor / escala.maximo) * 100)}%` }}
                        />
                      </span>
                      <span className="text-compacto font-semibold text-texto-principal">{formatar(valor)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        <details className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
          <summary className="cursor-pointer font-titulo text-compacto font-semibold text-marca-roxo">
            Ver os números de todos os estados em tabela
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-compacto">
              <caption className="sr-only">Números por estado: Adota Aqui e IBGE</caption>
              <thead>
                <tr className="border-b border-borda-sutil text-texto-terciario">
                  <th scope="col" className="py-2 pr-3 font-semibold">Estado</th>
                  {medidas.map((opcao) => (
                    <th key={opcao.id} scope="col" className="py-2 pr-3 text-right font-semibold">{opcao.nome}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(estados).map(([sigla, nome]) => {
                  const doSite = dadosDoSite ? porEstado.find((linha) => linha.estado === sigla) : null;
                  return (
                    <tr key={sigla} className="border-b border-borda-sutil last:border-0">
                      <th scope="row" className="py-2 pr-3 font-normal text-texto-principal">{nome}</th>
                      {medidas.map((opcao) => (
                        <td key={opcao.id} className="py-2 pr-3 text-right text-texto-secundario">
                          {opcao.doSite
                            ? doSite
                              ? doSite[opcao.id].toLocaleString("pt-BR")
                              : "-"
                            : porcentagem(laresComPet[sigla][opcao.id])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section aria-labelledby="retrato-titulo" className="flex flex-col gap-5">
        <h2 id="retrato-titulo" className="font-titulo text-secao font-semibold text-texto-principal">
          O retrato no Brasil
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {retrato.map((item) => (
            <li key={item.numero} className="flex flex-col rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
              <p className="font-titulo text-[34px] font-semibold leading-none text-marca-roxo">{item.numero}</p>
              <p className="mt-2 flex-1 text-compacto text-texto-principal">{item.texto}</p>
              <p className="mt-4 text-legenda text-texto-terciario">
                Fonte:{" "}
                <a href={item.link} target="_blank" rel="noreferrer" className={estiloDoLink}>
                  {item.fonte}
                  <span className="sr-only"> (abre em outra aba)</span>
                </a>
              </p>
            </li>
          ))}
        </ul>
        <p className="text-legenda text-texto-terciario">
          Não existe um censo oficial de animais abandonados no Brasil. Os totais do país são estimativas das
          instituições citadas.
        </p>
      </section>

      <section
        aria-labelledby="lei-titulo"
        className="grid gap-6 rounded-[20px] bg-fundo-marca p-6 text-texto-sobre-marca md:grid-cols-3 md:p-8"
      >
        <div>
          <h2 id="lei-titulo" className="font-titulo text-secao font-semibold">
            Maus-tratos é crime
          </h2>
          <p className="mt-2 text-compacto opacity-90">
            A{" "}
            <a
              href="https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14064.htm"
              target="_blank"
              rel="noreferrer"
              className="rounded-sm underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto-sobre-marca"
            >
              Lei 14.064/2020
              <span className="sr-only"> (abre em outra aba)</span>
            </a>
            , a Lei Sansão, pune maus-tratos a cães e gatos com 2 a 5 anos de reclusão, multa e a proibição da
            guarda.
          </p>
        </div>
        <div>
          <h3 className="font-titulo text-item font-semibold">Viu maus-tratos?</h3>
          <p className="mt-2 text-compacto opacity-90">
            Se está acontecendo agora, ligue 190. Se não, registre um boletim de ocorrência na delegacia ou na
            delegacia online do seu estado.
          </p>
        </div>
        <div>
          <h3 className="font-titulo text-item font-semibold">RG de graça pro seu animal</h3>
          <p className="mt-2 text-compacto opacity-90">
            O SinPatinhas é o cadastro nacional de cães e gatos, do governo federal, e é gratuito.
          </p>
          <a
            href="https://www.gov.br/pt-br/servicos/cadastrar-caes-e-gatos"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block rounded-sm font-titulo text-compacto font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto-sobre-marca"
          >
            Cadastrar no gov.br
            <span className="sr-only"> (abre em outra aba)</span>
          </a>
        </div>
      </section>

      <section aria-labelledby="mudar-titulo" className="flex flex-col items-center gap-4 text-center">
        <h2 id="mudar-titulo" className="font-titulo text-secao font-semibold text-texto-principal">
          Cada adoção muda esses números
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Botao para="/animais">Ver animais para adoção</Botao>
          <Botao variante="secundario" para="/feiras">
            Ver feiras de adoção
          </Botao>
        </div>
      </section>
    </main>
  );
}
