package com.adotaaqui.repository;

import com.adotaaqui.model.Animal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AnimalRepository extends JpaRepository<Animal, UUID> {
}
