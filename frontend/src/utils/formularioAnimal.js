import { somenteNumeros } from './mascaras';

// Tudo que o formulário de animal precisa e não depende de tela: valores iniciais,
// conversão de/para o formato da API e validação. Funções puras, fáceis de testar.

export const LIMITE_DA_FOTO_EM_BYTES = 5 * 1024 * 1024;
export const TIPOS_DE_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

// Formulário em branco. A convivência começa em "Não testado": é a resposta honesta
// de quem ainda não sabe, e o protetor só muda o que conhece
export const animalVazio = {
    nome: '',
    especie: '',
    raca: '',
    porte: '',
    sexo: '',
    peso: '',
    nascimento: '',
    castrado: '',
    convivenciaCrianca: 'NAO_TESTADO',
    convivenciaCao: 'NAO_TESTADO',
    convivenciaGato: 'NAO_TESTADO',
    energia: '',
    historia: '',
    fotos: [],
    vacinas: [],
};

// "042023" vira "04/2023" enquanto a pessoa digita
export function mascaraMesAno(texto) {
    const numeros = somenteNumeros(texto).slice(0, 6);
    return numeros.length > 2 ? `${numeros.slice(0, 2)}/${numeros.slice(2)}` : numeros;
}

// "04/2023" vira "2023-04-01" (o dia é estimado, então vai o primeiro do mês)
export function mesAnoParaData(mesAno) {
    const [mes, ano] = mesAno.split('/');
    return `${ano}-${mes}-01`;
}

// "2023-04-15" vira "04/2023"
export function dataParaMesAno(data) {
    if (!data) return '';
    const [ano, mes] = data.split('-');
    return `${mes}/${ano}`;
}

// Resposta da API (GET /api/animais/{id}) -> valores do formulário
export function animalParaFormulario(animal) {
    return {
        nome: animal.nome,
        especie: animal.especie,
        raca: animal.raca,
        porte: animal.porte,
        sexo: animal.sexo,
        peso: animal.peso ? String(animal.peso).replace('.', ',') : '',
        nascimento: dataParaMesAno(animal.dataNascEstimada),
        castrado: animal.castrado ? 'SIM' : 'NAO',
        convivenciaCrianca: animal.convivencia.crianca,
        convivenciaCao: animal.convivencia.cao,
        convivenciaGato: animal.convivencia.gato,
        energia: animal.energia,
        historia: animal.historia ?? '',
        fotos: [...animal.fotos],
        // a vacina da API tem id, mas o PUT não usa: a lista enviada substitui a atual
        vacinas: animal.vacinas.map(({ nome, dose, dataAplicacao }) => ({ nome, dose, dataAplicacao })),
    };
}

// Valores do formulário -> corpo do POST/PUT (docs/api.md, seção 7)
export function formularioParaApi(valores) {
    const peso = valores.peso.trim();
    return {
        nome: valores.nome.trim(),
        especie: valores.especie,
        raca: valores.raca,
        sexo: valores.sexo,
        porte: valores.porte,
        peso: peso ? Number(peso.replace(',', '.')) : null,
        dataNascEstimada: mesAnoParaData(valores.nascimento),
        castrado: valores.castrado === 'SIM',
        energia: valores.energia,
        convivencia: {
            crianca: valores.convivenciaCrianca,
            cao: valores.convivenciaCao,
            gato: valores.convivenciaGato,
        },
        historia: valores.historia.trim(),
        fotos: valores.fotos,
        vacinas: valores.vacinas.map(({ nome, dose, dataAplicacao }) => ({
            nome,
            dose: dose || null,
            dataAplicacao: dataAplicacao || null,
        })),
    };
}

const obrigatorios = {
    especie: 'Escolha a espécie.',
    raca: 'Escolha a raça.',
    porte: 'Escolha o porte.',
    sexo: 'Escolha o sexo.',
    castrado: 'Informe se é castrado.',
    energia: 'Escolha o nível de energia.',
};

// As mesmas regras do back (AnimalRequest), conferidas antes de enviar
export function validarAnimal(valores, hoje = new Date()) {
    const erros = {};

    const nome = valores.nome.trim();
    if (!nome) erros.nome = 'Informe o nome.';
    else if (nome.length > 80) erros.nome = 'O nome pode ter no máximo 80 caracteres.';

    Object.entries(obrigatorios).forEach(([campo, mensagem]) => {
        if (!valores[campo]) erros[campo] = mensagem;
    });

    const peso = valores.peso.trim();
    if (peso && !(Number(peso.replace(',', '.')) > 0)) erros.peso = 'O peso precisa ser um número maior que zero.';

    const erroNascimento = validarNascimento(valores.nascimento, hoje);
    if (erroNascimento) erros.nascimento = erroNascimento;

    if (!valores.historia.trim()) erros.historia = 'Conte um pouco da trajetória do animal.';
    if (valores.fotos.length === 0) erros.fotos = 'Envie pelo menos uma foto.';

    return erros;
}

function validarNascimento(mesAno, hoje) {
    if (!mesAno) return 'Informe o mês e o ano aproximados.';
    const correspondencia = mesAno.match(/^(\d{2})\/(\d{4})$/);
    if (!correspondencia) return 'Use o formato MM/AAAA, por exemplo 04/2023.';
    const mes = Number(correspondencia[1]);
    const ano = Number(correspondencia[2]);
    if (mes < 1 || mes > 12) return 'O mês vai de 01 a 12.';
    if (ano < 1990) return 'Confira o ano.';
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;
    if (ano > anoAtual || (ano === anoAtual && mes > mesAtual)) return 'A data não pode ser no futuro.';
    return null;
}

// Erros de campo que vêm da API ("convivencia.crianca", "fotos[0]") -> nomes do formulário
export function errosDaApiParaFormulario(campos) {
    const erros = {};
    Object.entries(campos).forEach(([campo, mensagem]) => {
        if (campo.startsWith('convivencia.')) {
            const quem = campo.split('.')[1];
            erros[`convivencia${quem.charAt(0).toUpperCase()}${quem.slice(1)}`] = mensagem;
        } else if (campo === 'dataNascEstimada') {
            erros.nascimento = mensagem;
        } else if (campo.startsWith('fotos')) {
            erros.fotos = mensagem;
        } else if (campo.startsWith('vacinas')) {
            erros.vacinas = mensagem;
        } else if (campo === 'racaDaEspecie') {
            erros.raca = mensagem;
        } else {
            erros[campo] = mensagem;
        }
    });
    return erros;
}