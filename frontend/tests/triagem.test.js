import { respostasDaTriagem } from "../src/utils/triagem";

test("traduz as respostas da triagem pro protetor, na ordem das perguntas", () => {
  const respostas = respostasDaTriagem({
    moradia: "APARTAMENTO_TELADO",
    criancas: "SIM",
    tempoSozinho: "PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR",
    outrosAnimais: "SIM_GATOS",
    programacaoViagem: "LEVO_O_ANIMAL_COMIGO",
    momentoContato: "MANHA",
  });

  expect(respostas.map(({ campo }) => campo)).toEqual([
    "moradia",
    "criancas",
    "tempoSozinho",
    "outrosAnimais",
    "programacaoViagem",
    "momentoContato",
  ]);
  expect(respostas[0]).toEqual({ campo: "moradia", pergunta: "Tipo de moradia", resposta: "Apartamento com tela" });
  expect(respostas[2].resposta).toBe("Prefere responder na conversa");
  expect(respostas[5].resposta).toBe("Manhã");
});

test("resposta que não veio aparece como não informada", () => {
  expect(respostasDaTriagem({})[0].resposta).toBe("Não informado");
});
