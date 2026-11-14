// Como cada feira de adoção aparece na tela, e os links "Como chegar" e "Adicionar à agenda".
// Os dois links são do Google e não precisam de chave

const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const mesesPorExtenso = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const diasDaSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// A data vem como "2026-11-21". Montar a data com os números evita o fuso do navegador trocar o dia
function paraData(data) {
    const [ano, mes, dia] = data.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
}

// Pro quadradinho do calendário: { dia: "21", mes: "nov", semana: "sábado" }
export function diaDaFeira(data) {
    const quando = paraData(data);
    return {
        dia: String(quando.getDate()),
        mes: meses[quando.getMonth()],
        semana: diasDaSemana[quando.getDay()],
    };
}

// "sábado, 21 de novembro"
export function dataPorExtenso(data) {
    const quando = paraData(data);
    return `${diasDaSemana[quando.getDay()]}, ${quando.getDate()} de ${mesesPorExtenso[quando.getMonth()]}`;
}

// "Hoje" e "Amanhã" ganham destaque no card. Nos outros dias, null
export function diaEmDestaque(data, hoje = new Date()) {
    const umDia = 24 * 60 * 60 * 1000;
    const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dias = Math.round((paraData(data) - inicioDeHoje) / umDia);
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Amanhã';
    return null;
}

// "09:00:00" vira "9h", e "14:30" vira "14h30"
function hora(texto) {
    const [h, m] = texto.split(':');
    return `${Number(h)}h${m === '00' ? '' : m}`;
}

// "das 9h às 13h"
export function horarioDaFeira({ horaInicio, horaFim }) {
    return `das ${hora(horaInicio)} às ${hora(horaFim)}`;
}

// O horário da feira é o da cidade dela. A agenda do Google precisa saber o fuso,
// senão quem mora em outro fuso veria a feira na hora errada
const fusos = {
    AC: 'America/Rio_Branco',
    AM: 'America/Manaus',
    RR: 'America/Boa_Vista',
    RO: 'America/Porto_Velho',
    MT: 'America/Cuiaba',
    MS: 'America/Campo_Grande',
    PA: 'America/Belem',
    AP: 'America/Belem',
    TO: 'America/Araguaina',
    MA: 'America/Fortaleza',
    PI: 'America/Fortaleza',
    CE: 'America/Fortaleza',
    RN: 'America/Fortaleza',
    PB: 'America/Fortaleza',
    PE: 'America/Recife',
    AL: 'America/Maceio',
    SE: 'America/Maceio',
    BA: 'America/Bahia',
};

export function fusoDoEstado(estado) {
    return fusos[estado] ?? 'America/Sao_Paulo';
}

// "2026-11-21" e "09:00:00" viram "20261121T090000", o formato que a agenda do Google entende
function dataEHora(data, horaDoDia) {
    return `${data.replaceAll('-', '')}T${horaDoDia.slice(0, 5).replace(':', '')}00`;
}

// Abre a agenda do Google com a feira já preenchida. A pessoa só confirma
export function linkDaAgenda(feira) {
    const detalhes = [feira.descricao, `Organizada por ${feira.abrigo.nome}. Divulgada no Adota Aqui.`]
        .filter(Boolean)
        .join('\n\n');
    const parametros = new URLSearchParams({
        action: 'TEMPLATE',
        text: feira.titulo,
        dates: `${dataEHora(feira.data, feira.horaInicio)}/${dataEHora(feira.data, feira.horaFim)}`,
        details: detalhes,
        location: `${feira.local}, ${feira.endereco}, ${feira.cidade} - ${feira.estado}`,
        ctz: fusoDoEstado(feira.estado),
    });
    return `https://calendar.google.com/calendar/render?${parametros.toString()}`;
}

// Abre o Google Maps no endereço da feira (no celular, abre o app)
export function linkComoChegar(feira) {
    const lugar = `${feira.local}, ${feira.endereco}, ${feira.cidade} - ${feira.estado}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`;
}
