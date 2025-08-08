package com.flagcamp.delivery.repository;

import com.flagcamp.delivery.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    
    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);
    
    Optional<Address> findByIdAndUserId(Long id, Long userId);
    
    Optional<Address> findByUserIdAndIsDefaultTrue(Long userId);
    
    @Query("SELECT a FROM Address a WHERE a.user.id = :userId AND " +
           "(LOWER(a.label) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.address) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.city) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Address> searchAddressesByUser(@Param("userId") Long userId, @Param("query") String query);
}