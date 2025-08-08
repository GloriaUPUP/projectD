package com.flagcamp.delivery.repository;

import com.flagcamp.delivery.entity.NewAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewAddressRepository extends JpaRepository<NewAddress, Long> {
    
    Optional<NewAddress> findByPlaceId(String placeId);
    
    List<NewAddress> findByZipCode(String zipCode);
    
    @Query("SELECT a FROM NewAddress a WHERE a.formattedAddress LIKE %:keyword%")
    List<NewAddress> findByFormattedAddressContaining(@Param("keyword") String keyword);
}