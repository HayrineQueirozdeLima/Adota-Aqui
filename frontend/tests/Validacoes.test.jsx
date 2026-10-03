import {
  mascaraCep,
  mascaraCnpj,
  mascaraCpf,
  mascaraDocumento,
  mascaraTelefone,
  somenteNumeros,
} from "../src/utils/mascaras";
import {
  cnpjValido,
  cpfValido,
  validarCadastro,
  validarLogin,
} from "../src/utils/validacoes";

describe("máscaras", () => {
  test("tira tudo que não é número", () => {
    expect(somenteNumeros("529.982.247-25")).toBe("52998224725");
  });

  test("formata enquanto a pessoa digita, sem sobrar ponto no fim", () => {
    expect(mascaraCpf("529")).toBe("529");
    expect(mascaraCpf("5299")).toBe("529.9");
    expect(mascaraCpf("52998224725")).toBe("529.982.247-25");
    expect(mascaraCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(mascaraCep("76801000")).toBe("76801-000");
  });

  test("no login, vira CNPJ quando passa de 11 dígitos", () => {
    expect(mascaraDocumento("52998224725")).toBe("529.982.247-25");
    expect(mascaraDocumento("112223330001")).toBe("11.222.333/0001");
  });

  test("telefone fixo e celular", () => {
    expect(mascaraTelefone("6932221111")).toBe("(69) 3222-1111");
    expect(mascaraTelefone("69999998888")).toBe("(69) 99999-8888");
  });
});

describe("CPF e CNPJ", () => {
  test("aceita documentos com dígitos verificadores certos", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
  });

  test("recusa dígito errado, tamanho errado e números repetidos", () => {
    expect(cpfValido("529.982.247-26")).toBe(false);
    expect(cpfValido("5299822472")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("00.000.000/0000-00")).toBe(false);
  });
});

describe("validarLogin", () => {
  test("pede documento e senha", () => {
    expect(validarLogin({ documento: "", senha: "" })).toEqual({
      documento: "Informe seu CPF ou CNPJ.",
      senha: "Informe sua senha.",
    });
  });

  test("recusa documento que não tem 11 nem 14 dígitos (UC03 FA05)", () => {
    expect(validarLogin({ documento: "123", senha: "x" }).documento).toMatch(
      /11 dígitos/,
    );
  });
});

describe("validarCadastro", () => {
  const valido = {
    cpf: "529.982.247-25",
    cnpj: "",
    nome: "Marina Prado",
    razaoSocial: "",
    email: "marina@email.com",
    telefone: "(69) 99999-8888",
    senha: "senhaSegura1",
    confirmacaoSenha: "senhaSegura1",
    endereco: {
      cep: "76801-000",
      cidade: "Porto Velho",
      estado: "RO",
      logradouro: "",
      bairro: "",
      numero: "s/n",
    },
  };

  test("formulário certo não tem erro", () => {
    expect(validarCadastro(valido, "USUARIO")).toEqual({});
  });

  test("aponta cada campo com problema, com o mesmo nome da API", () => {
    const erros = validarCadastro(
      {
        ...valido,
        cpf: "111.111.111-11",
        email: "marina@",
        telefone: "6999",
        senha: "curta",
        confirmacaoSenha: "outra",
        endereco: {
          ...valido.endereco,
          cep: "768",
          estado: "Rondônia",
          numero: "",
        },
      },
      "USUARIO",
    );
    expect(Object.keys(erros)).toEqual([
      "cpf",
      "email",
      "telefone",
      "senha",
      "confirmacaoSenha",
      "endereco.cep",
      "endereco.estado",
      "endereco.numero",
    ]);
  });

  test("o abrigo precisa de CNPJ e razão social, e não de CPF", () => {
    const erros = validarCadastro({ ...valido, cpf: "" }, "ABRIGO");
    expect(erros.cnpj).toBe("Informe o CNPJ.");
    expect(erros.razaoSocial).toBe("Informe a razão social.");
    expect(erros.cpf).toBeUndefined();
  });
});
