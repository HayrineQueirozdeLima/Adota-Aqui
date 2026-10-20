import { useRef, useState } from "react";
import CampoTexto from "../CampoTexto/CampoTexto";
import { buscarEndereco } from "../../services/viacep";
import { mascaraCep, somenteNumeros } from "../../utils/mascaras";

// Bloco de endereço dos cadastros. A pessoa digita o CEP e o número (RF01, RF02);
// cidade, estado e logradouro vêm do ViaCEP. Eles continuam editáveis pra quando
// o CEP não é encontrado ou o ViaCEP está fora do ar.
// O bairro não aparece no Figma, mas vem do ViaCEP e vai junto pro back.
export default function CamposEndereco({ titulo, endereco, erros, aoMudar }) {
  const [buscando, setBuscando] = useState(false);
  const [erroCep, setErroCep] = useState("");
  const ultimoCep = useRef("");

  async function mudarCep(evento) {
    const cep = mascaraCep(evento.target.value);
    const digitos = somenteNumeros(cep);
    aoMudar({ cep });
    setErroCep("");
    ultimoCep.current = digitos;

    if (digitos.length !== 8) {
      setBuscando(false);
      return;
    }

    setBuscando(true);
    try {
      const encontrado = await buscarEndereco(digitos);
      // Se a pessoa mudou o CEP enquanto a busca rodava, essa resposta já é velha
      if (ultimoCep.current === digitos) aoMudar(encontrado);
    } catch (erro) {
      if (ultimoCep.current === digitos) setErroCep(erro.message);
    }
    if (ultimoCep.current === digitos) setBuscando(false);
  }

  // Liga um input a um campo do endereço
  function campo(nome, transformar = (valor) => valor) {
    return {
      name: `endereco.${nome}`,
      value: endereco[nome],
      erro: erros[`endereco.${nome}`],
      onChange: (evento) =>
        aoMudar({ [nome]: transformar(evento.target.value) }),
    };
  }

  return (
    <fieldset>
      <legend className="mb-[18px] font-titulo text-overline uppercase text-texto-terciario">
        {titulo}
      </legend>
      <div className="flex flex-col gap-[18px]">
        <div className="grid gap-x-3 gap-y-[18px] md:grid-cols-3">
          <CampoTexto
            rotulo="CEP"
            name="endereco.cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={endereco.cep}
            onChange={mudarCep}
            erro={erros["endereco.cep"] || erroCep}
            dica={buscando ? "Buscando endereço..." : undefined}
          />
          <CampoTexto
            rotulo="Cidade"
            autoComplete="address-level2"
            placeholder="Porto Velho"
            {...campo("cidade")}
          />
          <CampoTexto
            rotulo="Estado"
            autoComplete="address-level1"
            placeholder="RO"
            maxLength={2}
            {...campo("estado", (valor) => valor.toUpperCase())}
          />
        </div>
        <div className="grid gap-x-3 gap-y-[18px] md:grid-cols-2">
          <CampoTexto
            rotulo="Logradouro"
            autoComplete="address-line1"
            placeholder="Av. Sete de Setembro"
            {...campo("logradouro")}
          />
          <CampoTexto
            rotulo="Número"
            placeholder="1040 ou s/n"
            {...campo("numero")}
          />
        </div>
      </div>
    </fieldset>
  );
}
