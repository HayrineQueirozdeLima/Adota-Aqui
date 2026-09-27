/**
 * Services: as regras de negócio. É o coração do back.
 *
 * Exemplos do que mora aqui:
 * - aprovar um interesse, deixar o animal ADOTADO e descontinuar os outros interesses (RF10);
 * - travar a edição de animal ADOTADO, só o status pode mudar (RF06);
 * - conferir se a raça é da espécie informada;
 * - filtrar a listagem pelo estado do Usuario logado (RF14);
 * - conferir se quem pediu é mesmo o dono do animal antes de editar ou remover.
 *
 * Caminho de uma requisição: controller -> service -> repository -> banco.
 */
package com.adotaaqui.service;
