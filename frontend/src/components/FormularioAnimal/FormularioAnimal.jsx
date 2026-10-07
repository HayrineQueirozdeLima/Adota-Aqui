import { useEffect, useRef, useState } from "react";
import Botao from "../Botao/Botao";
import CampoSelecao from "../CampoSelecao/CampoSelecao";
import CampoTexto from "../CampoTexto/CampoTexto";
import EnvioFotos from "../EnvioFotos/EnvioFotos";
import GrupoOpcoes from "../GrupoOpcoes/GrupoOpcoes";
import ListaVacinas from "../ListaVacinas/ListaVacinas";
import Tag from "../Tag/Tag";
import { useAuth } from "../../contexts/AuthContext";
import { useFocoNoPrimeiroErro } from "../../hooks/useFocoNoPrimeiroErro";
import { listarRacas } from "../../services/animais";
import {
  animalVazio,
  errosDaApiParaFormulario,
  formularioParaApi,
  mascaraMesAno,
  validarAnimal,
} from "../../utils/formularioAnimal";
import { especies, portes, sexos } from "../../utils/rotulos";

const paraOpcoes = (rotulos) =>
  Object.entries(rotulos).map(([valor, nome]) => ({ valor, nome }));

const convivencia = [
  { valor: "CONVIVE_BEM", nome: "Convive bem" },
  { valor: "NAO_CONVIVE_BEM", nome: "Não convive bem" },
  { valor: "NAO_TESTADO", nome: "Não testado" },
];

// Formulário do animal (Figma: "Cadastrar animal"), usado no cadastro e na edição.
// Na edição de um animal ADOTADO, só o status fica editável. Os outros campos destravam
// quando o status volta pra DISPONIVEL, na mesma tela (RF06, UC05 FA04).
export default function FormularioAnimal({
  titulo,
  subtitulo,
  textoEnviar,
  inicial = animalVazio,
  statusOriginal = null,
  aoEnviar,
  cancelarPara,
}) {
  const { sair } = useAuth();
  const [valores, setValores] = useState(inicial);
  const [status, setStatus] = useState(statusOriginal);
  const [racas, setRacas] = useState([]);
  const [erros, setErros] = useState({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmandoDevolucao, setConfirmandoDevolucao] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const formulario = useRef(null);

  useFocoNoPrimeiroErro(formulario, tentativas);

  const travado = statusOriginal === "ADOTADO" && status === "ADOTADO";
  const devolucao = statusOriginal === "ADOTADO" && status === "DISPONIVEL";

  // As raças dependem da espécie (GET /api/racas?especie=...)
  useEffect(() => {
    if (!valores.especie) return undefined;
    let cancelado = false;
    listarRacas(valores.especie)
      .then((lista) => {
        if (!cancelado) setRacas(lista);
      })
      .catch(() => {
        if (!cancelado) setRacas([]);
      });
    return () => {
      cancelado = true;
    };
  }, [valores.especie]);

  function mudar(campo, valor) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  // Trocou a espécie: a raça escolhida pode não existir na outra, então volta pra vazio
  function mudarEspecie(especie) {
    setValores((atuais) => ({ ...atuais, especie, raca: "" }));
    setRacas([]);
    setErros((atuais) => ({ ...atuais, especie: undefined, raca: undefined }));
  }

  function adicionarFoto(url) {
    setValores((atuais) => ({ ...atuais, fotos: [...atuais.fotos, url] }));
    setErros((atuais) => ({ ...atuais, fotos: undefined }));
  }

  function removerFoto(posicao) {
    setValores((atuais) => ({
      ...atuais,
      fotos: atuais.fotos.filter((_, i) => i !== posicao),
    }));
  }

  // Leva a foto pro começo da lista: a primeira é a capa
  function tornarPrincipal(posicao) {
    setValores((atuais) => {
      const fotos = [...atuais.fotos];
      const [escolhida] = fotos.splice(posicao, 1);
      return { ...atuais, fotos: [escolhida, ...fotos] };
    });
  }

  function adicionarVacina(vacina) {
    setValores((atuais) => ({
      ...atuais,
      vacinas: [...atuais.vacinas, vacina],
    }));
  }

  function removerVacina(posicao) {
    setValores((atuais) => ({
      ...atuais,
      vacinas: atuais.vacinas.filter((_, i) => i !== posicao),
    }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErroEnvio("");

    const encontrados = validarAnimal(valores);
    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados);
      setConfirmandoDevolucao(false);
      setTentativas((total) => total + 1);
      return;
    }

    // Devolução (ADOTADO -> DISPONIVEL): pede confirmação antes de enviar (UC05 FA04, passo 6)
    if (devolucao && !confirmandoDevolucao) {
      setConfirmandoDevolucao(true);
      return;
    }

    setEnviando(true);
    try {
      await aoEnviar(formularioParaApi(valores), status);
    } catch (erro) {
      if (erro.status === 401) {
        sair();
        return;
      }
      const doServidor = errosDaApiParaFormulario(erro.campos);
      if (Object.keys(doServidor).length > 0) {
        setErros(doServidor);
        setTentativas((total) => total + 1);
      } else {
        setErroEnvio(erro.message);
      }
      setConfirmandoDevolucao(false);
      setEnviando(false);
    }
  }

  const nome = valores.nome.trim() || "o animal";

  return (
    <form ref={formulario} onSubmit={enviar} noValidate>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-titulo text-secao font-semibold text-texto-principal">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="mt-1 text-corpo text-texto-secundario">{subtitulo}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Botao variante="secundario" para={cancelarPara}>
            Cancelar
          </Botao>
          <Botao type="submit" disabled={enviando || travado}>
            {enviando ? "Salvando..." : textoEnviar}
          </Botao>
        </div>
      </div>

      {travado && (
        <p className="mt-5 rounded-[12px] bg-status-atencao-fundo px-5 py-4 text-compacto text-status-atencao-texto">
          <strong>{nome} foi adotado.</strong> Os dados ficam travados pra
          preservar o histórico da adoção. Pra editar, mude o status para
          Disponível (devolução).
        </p>
      )}

      {confirmandoDevolucao && (
        <div
          role="alert"
          className="mt-5 rounded-[12px] border border-borda-sutil bg-fundo-superficie p-5"
        >
          <p className="font-titulo font-semibold text-texto-principal">
            Tornar {nome} disponível de novo?
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            {nome} volta pra vitrine e pode receber novos interesses. O
            interesse aprovado na adoção continua no histórico.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando..." : "Confirmar e salvar"}
            </Botao>
            <Botao
              variante="secundario"
              onClick={() => setConfirmandoDevolucao(false)}
              disabled={enviando}
            >
              Voltar
            </Botao>
          </div>
        </div>
      )}

      {erroEnvio && (
        <p
          role="alert"
          className="mt-5 rounded-[10px] bg-status-erro-fundo px-4 py-3 text-compacto text-status-erro-texto"
        >
          {erroEnvio}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
        {/* fieldset disabled: trava todos os campos de dentro de uma vez só */}
        <fieldset disabled={travado} className="flex min-w-0 flex-col gap-5">
          <Cartao titulo="Identificação">
            <div className="grid gap-4 sm:grid-cols-3">
              <CampoTexto
                rotulo="Nome"
                value={valores.nome}
                onChange={(e) => mudar("nome", e.target.value)}
                maxLength={80}
                erro={erros.nome}
              />
              <CampoSelecao
                rotulo="Espécie"
                opcoes={paraOpcoes(especies)}
                value={valores.especie}
                onChange={(e) => mudarEspecie(e.target.value)}
                erro={erros.especie}
              />
              <CampoSelecao
                rotulo="Raça"
                opcoes={racas}
                vazio={valores.especie ? "Escolha" : "Escolha a espécie antes"}
                value={valores.raca}
                onChange={(e) => mudar("raca", e.target.value)}
                disabled={!valores.especie}
                erro={erros.raca}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <CampoSelecao
                rotulo="Porte"
                opcoes={paraOpcoes(portes)}
                value={valores.porte}
                onChange={(e) => mudar("porte", e.target.value)}
                erro={erros.porte}
              />
              <CampoSelecao
                rotulo="Sexo"
                opcoes={paraOpcoes(sexos)}
                value={valores.sexo}
                onChange={(e) => mudar("sexo", e.target.value)}
                erro={erros.sexo}
              />
              <CampoTexto
                rotulo="Peso (kg) · opcional"
                inputMode="decimal"
                placeholder="14"
                value={valores.peso}
                onChange={(e) => mudar("peso", e.target.value)}
                erro={erros.peso}
              />
              <CampoTexto
                rotulo="Nascimento estimado"
                inputMode="numeric"
                placeholder="MM/AAAA"
                value={valores.nascimento}
                onChange={(e) =>
                  mudar("nascimento", mascaraMesAno(e.target.value))
                }
                erro={erros.nascimento}
              />
            </div>
            <div className="mt-4">
              <GrupoOpcoes
                nome="castrado"
                legenda="Castrado"
                opcoes={[
                  { valor: "SIM", nome: "Sim" },
                  { valor: "NAO", nome: "Não" },
                ]}
                valor={valores.castrado}
                aoMudar={(valor) => mudar("castrado", valor)}
                erro={erros.castrado}
              />
            </div>
          </Cartao>

          <Cartao titulo="Convivência e energia">
            <p className="-mt-1 mb-4 text-compacto text-texto-secundario">
              Dê respostas honestas e evite mal-entendidos.
            </p>
            <div className="flex flex-col gap-5">
              <GrupoOpcoes
                nome="convivenciaCrianca"
                legenda="Com crianças"
                opcoes={convivencia}
                valor={valores.convivenciaCrianca}
                aoMudar={(valor) => mudar("convivenciaCrianca", valor)}
                erro={erros.convivenciaCrianca}
              />
              <GrupoOpcoes
                nome="convivenciaCao"
                legenda="Com cães"
                opcoes={convivencia}
                valor={valores.convivenciaCao}
                aoMudar={(valor) => mudar("convivenciaCao", valor)}
                erro={erros.convivenciaCao}
              />
              <GrupoOpcoes
                nome="convivenciaGato"
                legenda="Com gatos"
                opcoes={convivencia}
                valor={valores.convivenciaGato}
                aoMudar={(valor) => mudar("convivenciaGato", valor)}
                erro={erros.convivenciaGato}
              />
              <GrupoOpcoes
                nome="energia"
                legenda="Nível de energia"
                opcoes={[
                  { valor: "MAIS_ANIMADO", nome: "Mais animado" },
                  { valor: "MAIS_CALMO", nome: "Mais calmo" },
                ]}
                valor={valores.energia}
                aoMudar={(valor) => mudar("energia", valor)}
                erro={erros.energia}
              />
            </div>
          </Cartao>

          <Cartao titulo="Histórico de vacinação">
            <ListaVacinas
              vacinas={valores.vacinas}
              aoAdicionar={adicionarVacina}
              aoRemover={removerVacina}
              erro={erros.vacinas}
              desativado={travado}
            />
          </Cartao>

          <Cartao titulo="Trajetória do animal">
            <label htmlFor="historia" className="sr-only">
              Trajetória do animal
            </label>
            <textarea
              id="historia"
              rows={5}
              value={valores.historia}
              onChange={(e) => mudar("historia", e.target.value)}
              placeholder="Como o animal chegou até você, temperamento, cuidados que precisa. Escreva como quem apresenta um amigo."
              aria-invalid={erros.historia ? true : undefined}
              aria-describedby={erros.historia ? "historia-erro" : undefined}
              className={`w-full rounded-[10px] border bg-fundo-superficie px-[15px] py-[14px] text-corpo text-texto-principal placeholder:text-texto-terciario focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-roxo ${
                erros.historia
                  ? "border-status-erro-texto"
                  : "border-borda-forte"
              }`}
            />
            {erros.historia && (
              <p
                id="historia-erro"
                className="mt-1.5 text-legenda text-status-erro-texto"
              >
                {erros.historia}
              </p>
            )}
          </Cartao>
        </fieldset>

        <aside className="flex flex-col gap-4">
          <Cartao titulo="Fotos">
            <EnvioFotos
              fotos={valores.fotos}
              aoAdicionar={adicionarFoto}
              aoRemover={removerFoto}
              aoTornarPrincipal={tornarPrincipal}
              erro={erros.fotos}
              desativado={travado}
            />
          </Cartao>

          {statusOriginal ? (
            <Cartao titulo="Status de adoção">
              {statusOriginal === "ADOTADO" ? (
                <CampoSelecao
                  rotulo="Status"
                  opcoes={[
                    { valor: "ADOTADO", nome: "Adotado" },
                    { valor: "DISPONIVEL", nome: "Disponível (devolução)" },
                  ]}
                  vazio="Escolha"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value || "ADOTADO");
                    setConfirmandoDevolucao(false);
                  }}
                  dica="Mude para Disponível se o animal voltou pra você."
                />
              ) : (
                <>
                  <Tag variante="disponivel">Disponível</Tag>
                  <p className="mt-2 text-legenda text-texto-terciario">
                    Vira Adotado quando você aprova um dos interesses recebidos.
                  </p>
                </>
              )}
            </Cartao>
          ) : (
            <Cartao titulo="Onde o animal aparece">
              <p className="text-compacto text-texto-secundario">
                O animal herda o estado da sua conta: só quem tem conta no seu
                estado pode demonstrar interesse.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Tag variante="disponivel">Disponível</Tag>
                <span className="text-legenda text-texto-terciario">
                  Status inicial, definido pelo sistema.
                </span>
              </div>
            </Cartao>
          )}

          <section className="rounded-[16px] bg-marca-roxo-suave p-5">
            <h2 className="font-titulo text-overline uppercase text-texto-terciario">
              Antes de publicar
            </h2>
            <p className="mt-3 text-compacto text-texto-secundario">
              A entrevista, a visita e a decisão final são suas. O Adota Aqui
              aproxima você de quem tem interesse.
            </p>
          </section>
        </aside>
      </div>
    </form>
  );
}

function Cartao({ titulo, children }) {
  return (
    <section className="rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5">
      <h2 className="mb-4 font-titulo text-overline uppercase text-texto-terciario">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
