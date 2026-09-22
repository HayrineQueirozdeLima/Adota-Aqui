package com.adotaaqui.repository;

import com.adotaaqui.model.Interesse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InteresseRepository extends JpaRepository<Interesse, UUID> {
}
