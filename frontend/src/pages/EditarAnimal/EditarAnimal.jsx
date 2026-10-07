import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AvisoPagina from "../../components/AvisoPagina/AvisoPagina";
import Botao from "../../components/Botao/Botao";
import Carregando from "../../components/Carregando/Carregando";
import FormularioAnimal from "../../components/FormularioAnimal/FormularioAnimal";
import { useAuth } from "../../contexts/AuthContext";
import {
  buscarAnimal,
  editarAnimal,
  removerAnimal,
} from "../../services/animais";
import { animalParaFormulario } from "../../utils/formularioAnimal";

// Editar ou remover animal (UC05, RF06), em /meus-animais/:id/editar
export default function EditarAnimal() {
  const { id } = useParams();
  const { token, sair } = useAuth();
  const navegar = useNavigate();
  const [animal, setAnimal] = useState(null);
  // "carregando" | "pronto" | "nao-encontrado" | "erro"
  const [situacao, setSituacao] = useState("carregando");

  useEffect(() => {
    let cancelado = false;
    buscarAnimal(id, token)
      .then((dados) => {
        if (cancelado) return;
        setAnimal(dados);
        setSituacao("pronto");
      })
      .catch((erro) => {
        if (cancelado) return;
        if (erro.status === 401) {
          sair();
          return;
        }
        setSituacao(
          erro.status === 404 || erro.status === 400
            ? "nao-encontrado"
            : "erro",
        );
      });
    return () => {
      cancelado = true;
    };
  }, [id, token, sair]);

  // PUT leva todos os campos, mais o status (docs/api.md, PUT /api/animais/{id})
  async function salvar(dados, statusAdocao) {
    const salvo = await editarAnimal(id, { ...dados, statusAdocao }, token);
    navegar("/meus-animais", {
      state: { aviso: `As alterações em ${salvo.nome} foram salvas.` },
    });
  }

  if (situacao === "carregando") {
    return (
      <main className="px-5 py-8 md:px-14">
        <Carregando texto="Carregando animal..." />
      </main>
    );
  }

  if (situacao === "nao-encontrado") {
    return (
      <AvisoPagina titulo="Animal não encontrado">
        <p>Ele pode ter sido removido, ou o endereço está errado.</p>
        <Botao para="/meus-animais" className="mt-5">
          Ver meus animais
        </Botao>
      </AvisoPagina>
    );
  }

  if (situacao === "erro") {
    return (
      <AvisoPagina titulo="Não foi possível carregar o animal" alerta>
        <p>Confira sua conexão e recarregue a página.</p>
      </AvisoPagina>
    );
  }

  // Só o protetor que cadastrou edita (o back também confere e responde 403)
  if (!animal.ehMeu) {
    return (
      <AvisoPagina titulo="Você não pode editar este animal">
        <p>Só quem cadastrou o animal pode editar ou remover.</p>
        <Botao para={`/animais/${id}`} className="mt-5">
          Ver o perfil de {animal.nome}
        </Botao>
      </AvisoPagina>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-6 md:px-14 md:py-8">
      <FormularioAnimal
        titulo={`Editar ${animal.nome}`}
        textoEnviar="Salvar alterações"
        inicial={animalParaFormulario(animal)}
        statusOriginal={animal.statusAdocao}
        aoEnviar={salvar}
        cancelarPara="/meus-animais"
      />
      <RemoverAnimal animal={animal} />
    </main>
  );
}

// UC05 FA03: remover pede confirmação, avisando que os interesses também vão embora
function RemoverAnimal({ animal }) {
  const { token, sair } = useAuth();
  const navegar = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState("");

  async function remover() {
    setRemovendo(true);
    setErro("");
    try {
      await removerAnimal(animal.id, token);
      navegar("/meus-animais", {
        state: { aviso: `${animal.nome} foi removido.` },
      });
    } catch (erroDaApi) {
      if (erroDaApi.status === 401) {
        sair();
        return;
      }
      setErro(erroDaApi.message);
      setRemovendo(false);
    }
  }

  return (
    <section className="mt-5 rounded-[16px] border border-borda-sutil bg-fundo-superficie p-5 lg:max-w-[calc(100%-370px)]">
      <h2 className="font-titulo text-overline uppercase text-texto-terciario">
        Remover animal
      </h2>
      {confirmando ? (
        <div className="mt-3">
          <p className="font-titulo font-semibold text-texto-principal">
            Remover {animal.nome} de vez?
          </p>
          <p className="mt-1 text-compacto text-texto-secundario">
            As fotos, as vacinas e os interesses recebidos também serão
            excluídos. Não dá pra desfazer.
          </p>
          {erro && (
            <p
              role="alert"
              className="mt-2 text-compacto text-status-erro-texto"
            >
              {erro}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao onClick={remover} disabled={removendo}>
              {removendo ? "Removendo..." : "Remover de vez"}
            </Botao>
            <Botao
              variante="secundario"
              onClick={() => setConfirmando(false)}
              disabled={removendo}
            >
              Voltar
            </Botao>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-compacto text-texto-secundario">
            O animal sai da vitrine e do seu painel, junto com os interesses
            recebidos.
          </p>
          <Botao variante="secundario" onClick={() => setConfirmando(true)}>
            Remover {animal.nome}
          </Botao>
        </div>
      )}
    </section>
  );
}
