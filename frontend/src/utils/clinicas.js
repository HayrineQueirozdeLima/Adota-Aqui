// Endereços do Google Maps usados na página de clínicas veterinárias (/clinicas).
// Nenhum dos dois precisa de chave: o do mapa é o formato de incorporar numa página (output=embed)
// e o do botão "Abrir no Google Maps" é o link oficial do Maps (api=1), que no celular abre o app.
// Quem sabe onde ficam as clínicas, o telefone e as avaliações é o Google, o site não guarda nada disso

// O que a gente procura em cada opção da página.
// "veterinário" é a categoria do Google, então pega clínica, hospital e consultório.
// Com "clínica veterinária", ficavam de fora os lugares que não têm "clínica" no nome.
// Muito veterinário atende dentro de pet shop, e o Google cadastra o lugar como pet shop: por isso a terceira opção
export const tiposDeBusca = {
    todas: 'veterinário',
    plantao: 'veterinário 24 horas',
    petshop: 'pet shop com veterinário',
};

// Três casas depois da vírgula dá uns 100 metros: perto o bastante pra achar as clínicas,
// sem mandar o ponto exato de onde a pessoa está
function arredondar(coordenada) {
    return Number(coordenada).toFixed(3);
}

function bairroDo(lugar) {
    return lugar.bairro?.trim() ?? '';
}

// O lugar vem de dois jeitos: { cidade, estado, bairro? } (digitado, do perfil ou do animal)
// ou { latitude, longitude } (botão "Usar minha localização")
export function textoDaBusca(tipo, lugar) {
    const oQue = tiposDeBusca[tipo] ?? tiposDeBusca.todas;
    if (lugar.latitude !== undefined) {
        return `${oQue} perto de ${arredondar(lugar.latitude)},${arredondar(lugar.longitude)}`;
    }
    const bairro = bairroDo(lugar);
    return `${oQue} em ${bairro ? `${bairro}, ` : ''}${lugar.cidade.trim()} ${lugar.estado}`;
}

// O mapa embutido mostra só uma parte dos lugares de cada busca, os que o Google acha mais relevantes.
// Quanto menor a área, mais lugares daquela área aparecem: por isso o bairro e a localização abrem mais perto
export function enderecoDoMapa(tipo, lugar) {
    let zoom = 12;
    if (lugar.latitude !== undefined) zoom = 14;
    else if (bairroDo(lugar)) zoom = 15;
    const busca = encodeURIComponent(textoDaBusca(tipo, lugar));
    return `https://maps.google.com/maps?q=${busca}&z=${zoom}&hl=pt-BR&output=embed`;
}

export function enderecoNoGoogleMaps(tipo, lugar) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textoDaBusca(tipo, lugar))}`;
}

// Pra mostrar na tela depois de "perto de": "Porto Velho/RO", "Centro, Porto Velho/RO"
// ou "você" quando veio da localização
export function nomeDoLugar(lugar) {
    if (lugar.latitude !== undefined) return 'você';
    const bairro = bairroDo(lugar);
    return `${bairro ? `${bairro}, ` : ''}${lugar.cidade.trim()}/${lugar.estado}`;
}

// O link "Clínicas perto de..." do perfil do animal manda pela URL a cidade onde o animal está
// (ou a do protetor, igual ao localDoAnimal): /clinicas?cidade=Porto+Velho&estado=RO
export function linkDasClinicas({ cidade, estado, protetor }) {
    const lugar = cidade && estado ? { cidade, estado } : protetor;
    if (!lugar?.cidade || !lugar?.estado) return '/clinicas';
    const parametros = new URLSearchParams({ cidade: lugar.cidade, estado: lugar.estado });
    return `/clinicas?${parametros.toString()}`;
}
