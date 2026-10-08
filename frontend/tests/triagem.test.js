import { respostasDaTriagem, resumoDaTriagem } from "../src/utils/triagem";

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

test("resume a triagem numa frase, sem o melhor momento pra contato", () => {
  expect(
    resumoDaTriagem({
      moradia: "APARTAMENTO_TELADO",
      criancas: "SIM",
      tempoSozinho: "ATE_8_HORAS",
      outrosAnimais: "SIM_GATOS",
      programacaoViagem: "LEVO_O_ANIMAL_COMIGO",
      momentoContato: "MANHA",
    }),
  ).toBe("Apartamento com tela, com crianças, até 8h sozinho, tem gatos, leva o animal nas viagens");
});

test("o que ficou pra conversa vira um aviso no fim do resumo", () => {
  const prefiro = "PREFIRO_RESPONDER_DIRETAMENTE_AO_PROTETOR";
  expect(resumoDaTriagem({ moradia: "CASA_SEM_QUINTAL", criancas: prefiro, tempoSozinho: prefiro })).toBe(
    "Casa sem quintal, prefere falar do resto na conversa",
  );
  expect(resumoDaTriagem({ moradia: prefiro })).toBe("Prefere responder na conversa");
});
