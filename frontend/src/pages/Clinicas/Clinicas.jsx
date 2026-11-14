import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Botao from "../../components/Botao/Botao";
import CampoSelecao from "../../components/CampoSelecao/CampoSelecao";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import Chip from "../../components/Chip/Chip";
import Pata from "../../components/Pata/Pata";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import { useTituloDaPagina } from "../../hooks/useTituloDaPagina";
import { buscarPerfil } from "../../services/perfil";
import {
  enderecoDoMapa,
  enderecoNoGoogleMaps,
  nomeDoLugar,
} from "../../utils/clinicas";
import { estados } from "../../utils/rotulos";

const opcoesDeEstado = Object.entries(estados).map(([sigla, nome]) => ({
  valor: sigla,
  nome,
}));

// "titulo" vai no título do mapa: "Pet shops com veterinário perto de Porto Velho/RO"
const tipos = [
  { valor: "todas", nome: "Todas as clínicas", titulo: "Clínicas veterinárias" },
  { valor: "plantao", nome: "Atendimento 24 horas", titulo: "Atendimento 24 horas" },
  { valor: "petshop", nome: "Pet shops com veterinário", titulo: "Pet shops com veterinário" },
];

// Cidade, estado e bairro que vieram na URL (link do perfil do animal ou link salvo), se forem válidos
function lugarDaUrl(parametros) {
  const cidade = parametros.get("cidade")?.trim();
  const estado = parametros.get("estado")?.toUpperCase();
  const bairro = parametros.get("bairro")?.trim();
  if (!cidade || !estados[estado]) return null;
  return bairro ? { cidade, estado, bairro } : { cidade, estado };
}

// O navegador avisa com um número o que deu errado. 1 quer dizer que a pessoa ou o navegador não deixou
function mensagemDaLocalizacao(erro) {
  if (erro?.code === 1) {
    return "O navegador não deixou usar sua localização. Libere o acesso nas configurações do site ou digite a cidade.";
  }
  return "Não foi possível descobrir sua localização agora. Tente de novo ou digite a cidade.";
}

// Clínicas veterinárias perto de você, em /clinicas. Aberta pra qualquer pessoa, em qualquer cidade do Brasil.
// O lugar vem da localização do navegador, da cidade digitada, do link do perfil do animal
// ou, pra quem está logado, da cidade do perfil. O mapa é do Google, e o site não guarda nada
export default function Clinicas() {
  const { usuario, token, sair } = useAuth();
  const [parametros, setParametros] = useSearchParams();
  const [lugar, setLugar] = useState(() => lugarDaUrl(parametros));
  const [campos, setCampos] = useState(() => ({
    cidade: "",
    estado: "",
    bairro: "",
    ...lugarDaUrl(parametros),
  }));
  const [tipo, setTipo] = useState("todas");
  const [erros, setErros] = useState({});
  const [tentativas, setTentativas] = useState(0);
  const [localizando, setLocalizando] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  // Fica true quando a pessoa já escolheu um lugar: aí o perfil, se chegar depois, não passa por cima
  const escolheu = useRef(lugar !== null);
  const refFormulario = useRef(null);
  const tituloDoMapa = useRef(null);
  // Aumenta a cada lugar escolhido pela pessoa (o do perfil e o da URL não contam)
  const [escolhas, setEscolhas] = useState(0);
  useTituloDaPagina("Clínicas veterinárias");
  useFocoNoPrimeiroErro(refFormulario, tentativas);

  // Depois de escolher o lugar, a tela vai pro mapa. No celular ele fica embaixo da busca,
  // e quem usa leitor de tela ouve o título com o lugar novo
  useEffect(() => {
    const titulo = tituloDoMapa.current;
    if (escolhas === 0 || !titulo) return;
    // Só rola se o mapa estiver fora de vista ou lá embaixo. No computador ele já está do lado da busca
    const { top } = titulo.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight / 2) {
      titulo.scrollIntoView?.({ block: "start" });
    }
    titulo.focus({ preventScroll: true });
  }, [escolhas]);

  const tipoConta = usuario?.tipoConta;
  const podeLocalizar =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  // Quem está logado já abre na cidade do perfil, a não ser que tenha chegado com uma cidade na URL.
  // Sessão vencida (401) sai da conta, como no resto do site
  useEffect(() => {
    if (!tipoConta || escolheu.current) return undefined;
    let cancelado = false;
    buscarPerfil(tipoConta, token)
      .then((perfil) => {
        const endereco = perfil?.endereco;
        if (cancelado || escolheu.current) return;
        if (!endereco?.cidade || !estados[endereco.estado]) return;
        const doPerfil = { cidade: endereco.cidade, estado: endereco.estado };
        setLugar(doPerfil);
        setCampos({ ...doPerfil, bairro: "" });
      })
      .catch((erro) => {
        if (!cancelado && erro.status === 401) sair();
      });
    return () => {
      cancelado = true;
    };
  }, [tipoConta, token, sair]);

  function mudarCampo(campo, valor) {
    setCampos({ ...campos, [campo]: valor });
    if (erros[campo]) setErros({ ...erros, [campo]: undefined });
  }

  function procurarNaCidade(evento) {
    evento.preventDefault();
    const novosErros = {};
    if (!campos.cidade.trim()) novosErros.cidade = "Digite a cidade";
    if (!campos.estado) novosErros.estado = "Escolha o estado";
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      setTentativas((atual) => atual + 1);
      return;
    }
    const bairro = campos.bairro.trim();
    const escolhido = { cidade: campos.cidade.trim(), estado: campos.estado };
    if (bairro) escolhido.bairro = bairro;
    escolheu.current = true;
    setErroLocalizacao("");
    setLugar(escolhido);
    setEscolhas((atual) => atual + 1);
    // A cidade fica na URL, então dá pra salvar o link ou mandar pra alguém
    setParametros(escolhido, { replace: true });
  }

  function usarLocalizacao() {
    setLocalizando(true);
    setErroLocalizacao("");
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        escolheu.current = true;
        setLocalizando(false);
        setErros({});
        setLugar({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        });
        setEscolhas((atual) => atual + 1);
        // Onde a pessoa está não vai pra URL, pra não ir junto se ela mandar o link pra alguém
        setParametros({}, { replace: true });
      },
      (erro) => {
        setLocalizando(false);
        setErroLocalizacao(mensagemDaLocalizacao(erro));
      },
      { timeout: 15000, maximumAge: 300000 },
    );
  }

  const nome = lugar ? nomeDoLugar(lugar) : "";
  const oQue = tipos.find((opcao) => opcao.valor === tipo).titulo;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-12 pt-6 md:px-14 md:pt-8">
      <div>
        <h1 className="font-titulo text-secao font-semibold text-texto-principal md:text-display">
          Clínicas veterinárias perto de você
        </h1>
        <p className="mt-2 max-w-[720px] text-corpo text-texto-secundario">
          Pra vacinar, castrar ou levar ao veterinário o animal que acabou de
          chegar em casa. Funciona em qualquer cidade do Brasil.
        </p>
      </div>

      {/* No computador, a busca e os avisos ficam numa coluna e o mapa ocupa o resto.
          No celular, a ordem é busca, mapa e avisos */}
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start">
        <section
          aria-labelledby="onde-procurar"
          className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5 lg:col-start-1 lg:row-start-1"
        >
          <h2
            id="onde-procurar"
            className="font-titulo text-item font-semibold text-texto-principal"
          >
            Onde procurar
          </h2>

          {podeLocalizar && (
            <>
              <Botao
                variante="secundario"
                onClick={usarLocalizacao}
                disabled={localizando}
                className="mt-4 w-full"
              >
                {localizando
                  ? "Procurando sua localização..."
                  : "Usar minha localização"}
              </Botao>
              <p className="mt-4 text-center text-legenda text-texto-terciario">
                ou digite a cidade
              </p>
            </>
          )}

          {erroLocalizacao && (
            <p
              role="alert"
              className="mt-3 text-compacto text-status-erro-texto"
            >
              {erroLocalizacao}
            </p>
          )}

          <form
            ref={refFormulario}
            noValidate
            onSubmit={procurarNaCidade}
            className="mt-4 flex flex-col gap-4"
          >
            <CampoTexto
              rotulo="Cidade"
              placeholder="Ex.: Porto Velho"
              maxLength={80}
              autoComplete="address-level2"
              value={campos.cidade}
              erro={erros.cidade}
              onChange={(evento) => mudarCampo("cidade", evento.target.value)}
            />
            <CampoSelecao
              rotulo="Estado"
              opcoes={opcoesDeEstado}
              value={campos.estado}
              erro={erros.estado}
              onChange={(evento) => mudarCampo("estado", evento.target.value)}
            />
            {/* Com o bairro, o mapa abre mais perto e mostra mais lugares daquela região */}
            <CampoTexto
              rotulo="Bairro (opcional)"
              placeholder="Ex.: Centro"
              maxLength={80}
              dica="Com o bairro, aparecem mais clínicas daquela região."
              value={campos.bairro}
              onChange={(evento) => mudarCampo("bairro", evento.target.value)}
            />
            <Botao type="submit" className="w-full">
              Ver clínicas
            </Botao>
          </form>
        </section>

        <section
          aria-labelledby="clinicas-no-mapa"
          className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="clinicas-no-mapa"
              ref={tituloDoMapa}
              tabIndex={-1}
              className="scroll-mt-4 font-titulo text-item font-semibold text-texto-principal focus:outline-none"
            >
              {lugar ? `${oQue} perto de ${nome}` : "Mapa"}
            </h2>
            {lugar && (
              <div
                role="group"
                aria-label="O que procurar"
                className="flex flex-wrap gap-2"
              >
                {tipos.map((opcao) => (
                  <Chip
                    key={opcao.valor}
                    ativo={tipo === opcao.valor}
                    onClick={() => setTipo(opcao.valor)}
                  >
                    {opcao.nome}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {lugar ? (
            <>
              <div className="overflow-hidden rounded-[16px] border border-borda-sutil bg-fundo-superficie">
                <iframe
                  title={`Mapa: ${oQue.toLowerCase()} perto de ${nome}`}
                  src={enderecoDoMapa(tipo, lugar)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="block h-[420px] w-full md:h-[520px] lg:h-[620px]"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-legenda text-texto-terciario">
                  Mapa e informações das clínicas: Google Maps.
                </p>
                <Botao variante="secundario" href={enderecoNoGoogleMaps(tipo, lugar)}>
                  Abrir no Google Maps
                </Botao>
              </div>
              {/* O mapa embutido não mostra todos os lugares, e a pessoa precisa saber disso pra não achar que não tem */}
              <div className="rounded-[16px] border border-borda-sutil bg-fundo-superficie px-5 py-4">
                <h3 className="font-titulo text-compacto font-semibold text-texto-principal">
                  Não achou a clínica que você conhece?
                </h3>
                <p className="mt-1 text-compacto text-texto-secundario">
                  O mapa mostra só uma parte dos lugares de cada busca, os que o
                  Google acha mais relevantes. Pra ver mais: digite o bairro,
                  troque entre as opções acima (muita clínica atende dentro de
                  pet shop) ou abra no Google Maps, que vai mostrando mais
                  lugares conforme você aproxima e arrasta o mapa.
                </p>
              </div>
            </>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[16px] border border-dashed border-borda-forte bg-fundo-superficie px-6 py-10 text-center lg:min-h-[620px]">
              <Pata className="size-10 text-marca-roxo" />
              <p className="mt-3 font-titulo text-item font-semibold text-texto-principal">
                O mapa aparece aqui
              </p>
              <p className="mt-1 max-w-[360px] text-compacto text-texto-secundario">
                Use sua localização ou digite a cidade pra ver as clínicas
                veterinárias mais perto.
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-2">
          <p className="rounded-[16px] bg-status-atencao-fundo px-5 py-4 text-compacto text-status-atencao-texto">
            <strong>O Adota Aqui não indica nem avalia clínicas.</strong>{" "}
            Endereço, horário e avaliações vêm do Google Maps. Confirme por
            telefone antes de ir.
          </p>
          <div className="rounded-[16px] bg-marca-roxo-suave px-5 py-4">
            <h2 className="font-titulo text-compacto font-semibold text-texto-principal">
              Castração mais barata
            </h2>
            <p className="mt-1 text-compacto text-texto-secundario">
              Muitas prefeituras fazem castração gratuita ou a preço popular.
              Procure o Centro de Controle de Zoonoses ou a secretaria de meio
              ambiente da sua cidade.
            </p>
          </div>
        </div>
      </div>

      {/* Pro leitor de tela: avisa quando o mapa muda de lugar ou de tipo */}
      <p role="status" className="sr-only">
        {lugar ? `Mapa mostrando ${oQue.toLowerCase()} perto de ${nome}` : ""}
      </p>
    </main>
  );
}
