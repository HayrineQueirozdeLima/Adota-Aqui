// Busca o endereço pelo CEP no ViaCEP. Quem consulta é o front, e o back recebe o
// endereço completo (docs/api.md, ponto em aberto 1)
export async function buscarEndereco(cep) {
    let resposta;
    try {
        resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    } catch {
        throw new Error('Não deu pra buscar o CEP agora. Preencha cidade, estado e logradouro à mão.');
    }

    const dados = resposta.ok ? await resposta.json() : { erro: true };
    if (dados.erro) {
        throw new Error('CEP não encontrado. Confira os números.');
    }

    return {
        logradouro: dados.logradouro ?? '',
        bairro: dados.bairro ?? '',
        cidade: dados.localidade ?? '',
        estado: dados.uf ?? '',
    };
}