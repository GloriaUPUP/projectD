package com.flagcamp.delivery.repository;

import com.flagcamp.delivery.entity.NewUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NewUserRepository extends JpaRepository<NewUser, Long> {
    
    Optional<NewUser> findByEmail(String email);
    
    Optional<NewUser> findByPhone(String phone);
    
    boolean existsByEmail(String email);
}