import {
  dataPorExtenso,
  diaDaFeira,
  diaEmDestaque,
  fusoDoEstado,
  horarioDaFeira,
  linkComoChegar,
  linkDaAgenda,
} from "../src/utils/feiras";
import { feirasExemplo } from "../src/mocks/feiras";

// Como a feira aparece na tela e os links do Google (agenda e mapa)

const [parque, gatos] = feirasExemplo;

test("a data vira a folha do calendário e o texto por extenso, sem o fuso trocar o dia", () => {
  expect(diaDaFeira("2026-11-21")).toEqual({ dia: "21", mes: "nov", semana: "sábado" });
  expect(diaDaFeira("2027-01-01")).toEqual({ dia: "1", mes: "jan", semana: "sexta" });
  expect(dataPorExtenso("2026-11-21")).toBe("sábado, 21 de novembro");
});

test("hoje e amanhã ganham destaque, os outros dias não", () => {
  const hoje = new Date(2026, 10, 13, 22, 30); // 13 de novembro, de noite
  expect(diaEmDestaque("2026-11-13", hoje)).toBe("Hoje");
  expect(diaEmDestaque("2026-11-14", hoje)).toBe("Amanhã");
  expect(diaEmDestaque("2026-11-15", hoje)).toBeNull();
});

test("o horário fica curto: sem minutos quando é hora cheia", () => {
  expect(horarioDaFeira(parque)).toBe("das 9h às 13h");
  expect(horarioDaFeira(gatos)).toBe("das 14h30 às 18h");
});

test("cada estado tem o fuso da agenda, e os do horário de Brasília caem no padrão", () => {
  expect(fusoDoEstado("RO")).toBe("America/Porto_Velho");
  expect(fusoDoEstado("AC")).toBe("America/Rio_Branco");
  expect(fusoDoEstado("SP")).toBe("America/Sao_Paulo");
  expect(fusoDoEstado("DF")).toBe("America/Sao_Paulo");
});

test("adicionar à agenda abre o Google Agenda com a feira preenchida no fuso da cidade dela", () => {
  const link = new URL(linkDaAgenda(parque));
  expect(link.origin + link.pathname).toBe("https://calendar.google.com/calendar/render");
  expect(link.searchParams.get("action")).toBe("TEMPLATE");
  expect(link.searchParams.get("text")).toBe("Feira de adoção do Parque da Cidade");
  expect(link.searchParams.get("dates")).toBe("20300316T090000/20300316T130000");
  expect(link.searchParams.get("ctz")).toBe("America/Porto_Velho");
  expect(link.searchParams.get("location")).toBe(
    "Parque da Cidade, Avenida Jorge Teixeira, 1000, Embratel, Porto Velho - RO",
  );
  expect(link.searchParams.get("details")).toContain("Organizada por Instituto Quatro Patas");

  // Sem descrição, vai só quem organiza
  expect(new URL(linkDaAgenda(gatos)).searchParams.get("details")).toBe(
    "Organizada por Instituto Quatro Patas. Divulgada no Adota Aqui.",
  );
});

test("como chegar abre o Google Maps no endereço da feira", () => {
  const link = new URL(linkComoChegar(gatos));
  expect(link.searchParams.get("api")).toBe("1");
  expect(link.searchParams.get("query")).toBe(
    "Pet Shop Amigo Fiel, Rua das Flores, 200, Centro, Santo André - SP",
  );
});
