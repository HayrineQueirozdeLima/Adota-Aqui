// Endereços do Google Maps usados na página de clínicas veterinárias (/clinicas).
// Nenhum dos dois precisa de chave: o do mapa é o formato de incorporar numa página (output=embed)
// e o do botão "Abrir no Google Maps" é o link oficial do Maps (api=1), que no celular abre o app.
// Quem sabe onde ficam as clínicas, o telefone e as avaliações é o Google, o site não guarda nada disso

// O que a gente procura em cada opção da página
export const tiposDeBusca = {
    todas: 'clínica veterinária',
    plantao: 'clínica veterinária 24 horas',
};

// Três casas depois da vírgula dá uns 100 metros: perto o bastante pra achar as clínicas,
// sem mandar o ponto exato de onde a pessoa está
function arredondar(coordenada) {
    return Number(coordenada).toFixed(3);
}

// O lugar vem de dois jeitos: { cidade, estado } (digitado, do perfil ou do animal)
// ou { latitude, longitude } (botão "Usar minha localização")
export function textoDaBusca(tipo, lugar) {
    const oQue = tiposDeBusca[tipo] ?? tiposDeBusca.todas;
    if (lugar.latitude !== undefined) {
        return `${oQue} perto de ${arredondar(lugar.latitude)},${arredondar(lugar.longitude)}`;
    }
    return `${oQue} em ${lugar.cidade.trim()} ${lugar.estado}`;
}

// Pela localização o mapa abre mais perto, porque é um ponto e não a cidade inteira
export function enderecoDoMapa(tipo, lugar) {
    const zoom = lugar.latitude !== undefined ? 14 : 12;
    const busca = encodeURIComponent(textoDaBusca(tipo, lugar));
    return `https://maps.google.com/maps?q=${busca}&z=${zoom}&hl=pt-BR&output=embed`;
}

export function enderecoNoGoogleMaps(tipo, lugar) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textoDaBusca(tipo, lugar))}`;
}

// Pra mostrar na tela depois de "perto de": "Porto Velho/RO", ou "você" quando veio da localização
export function nomeDoLugar(lugar) {
    if (lugar.latitude !== undefined) return 'você';
    return `${lugar.cidade.trim()}/${lugar.estado}`;
}

// O link "Clínicas perto de..." do perfil do animal manda pela URL a cidade onde o animal está
// (ou a do protetor, igual ao localDoAnimal): /clinicas?cidade=Porto+Velho&estado=RO
export function linkDasClinicas({ cidade, estado, protetor }) {
    const lugar = cidade && estado ? { cidade, estado } : protetor;
    if (!lugar?.cidade || !lugar?.estado) return '/clinicas';
    const parametros = new URLSearchParams({ cidade: lugar.cidade, estado: lugar.estado });
    return `/clinicas?${parametros.toString()}`;
}
