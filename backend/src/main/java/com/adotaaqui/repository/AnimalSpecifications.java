package com.adotaaqui.repository;

import com.adotaaqui.dto.AnimalFiltroRequest;
import com.adotaaqui.model.Animal;
import com.adotaaqui.model.enums.StatusAdocao;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Composição das consultas; o Service decide qual estado deve ser aplicado. */
public final class AnimalSpecifications {
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
            if (filtro.getCidade() != null && !filtro.getCidade().isBlank()) {
                String cidade = filtro.getCidade().trim().toLowerCase(Locale.ROOT);
                criterios.add(cb.or(cb.equal(cb.lower(usuario.get("endereco").get("cidade")), cidade),
                        cb.equal(cb.lower(abrigo.get("endereco").get("cidade")), cidade)));
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
}
