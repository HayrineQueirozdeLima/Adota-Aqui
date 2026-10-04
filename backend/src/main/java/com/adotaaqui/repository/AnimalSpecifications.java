package com.adotaaqui.repository;

import com.adotaaqui.dto.AnimalFiltroRequest;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.enums.StatusAdocao;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Composição das consultas; o Service decide qual estado deve ser aplicado. */
public final class AnimalSpecifications {
    // Letra com acento (minúscula e maiúscula) e a letra sem acento que fica no lugar, na mesma posição
    private static final String COM_ACENTO = "áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ";
    private static final String SEM_ACENTO = "aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn";

    private AnimalSpecifications() {}

    public static Specification<Animal> disponiveis(AnimalFiltroRequest filtro, String estado) {
        return (root, query, cb) -> {
            List<Predicate> criterios = new ArrayList<>();
            criterios.add(cb.equal(root.get("statusAdocao"), StatusAdocao.DISPONIVEL));
            var usuario = root.join("usuario", JoinType.LEFT);
            var abrigo = root.join("abrigo", JoinType.LEFT);
            if (estado != null) {
                criterios.add(cb.or(cb.equal(usuario.get("endereco").get("estado"), estado),
                        cb.equal(abrigo.get("endereco").get("estado"), estado)));
            }
            // Cidade: basta conter o que foi digitado, sem ligar pra maiúscula nem acento.
            // "porto" acha Porto Velho e Porto Alegre; "sao paulo" acha São Paulo.
            if (filtro.getCidade() != null && !filtro.getCidade().isBlank()) {
                String cidade = "%" + semAcento(filtro.getCidade()) + "%";
                criterios.add(cb.or(cb.like(semAcento(cb, usuario.get("endereco").get("cidade")), cidade),
                        cb.like(semAcento(cb, abrigo.get("endereco").get("cidade")), cidade)));
            }
            if (filtro.getEspecie() != null) criterios.add(cb.equal(root.get("especie"), filtro.getEspecie()));
            if (filtro.getRaca() != null) criterios.add(cb.equal(root.get("raca"), filtro.getRaca()));
            if (filtro.getPorte() != null) criterios.add(cb.equal(root.get("porte"), filtro.getPorte()));
            if (filtro.getSexo() != null) criterios.add(cb.equal(root.get("sexo"), filtro.getSexo()));
            if (filtro.getEnergia() != null) criterios.add(cb.equal(root.get("energia"), filtro.getEnergia()));
            if (filtro.getConvivenciaCrianca() != null) criterios.add(cb.equal(root.get("convivenciaCrianca"), filtro.getConvivenciaCrianca()));
            if (filtro.getConvivenciaGato() != null) criterios.add(cb.equal(root.get("convivenciaGato"), filtro.getConvivenciaGato()));
            if (filtro.getConvivenciaCao() != null) criterios.add(cb.equal(root.get("convivenciaCao"), filtro.getConvivenciaCao()));
            return cb.and(criterios.toArray(Predicate[]::new));
        };
    }

    // Tira o acento do texto que a pessoa digitou: "São Paulo" vira "sao paulo"
    static String semAcento(String texto) {
        String separado = Normalizer.normalize(texto.trim(), Normalizer.Form.NFD);
        return separado.replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }

    // Faz o mesmo do lado do banco, com o translate (troca letra por letra), que existe
    // no PostgreSQL e no H2. Assim a busca funciona igual no Neon e nos testes.
    private static Expression<String> semAcento(CriteriaBuilder cb, Expression<String> coluna) {
        return cb.function("translate", String.class,
                cb.lower(coluna), cb.literal(COM_ACENTO), cb.literal(SEM_ACENTO));
    }
}