package com.flagcamp.delivery.repository;

import com.flagcamp.delivery.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {
    
    List<Station> findByName(String name);
    
    @Query("SELECT s FROM Station s WHERE s.availableRobots > 0")
    List<Station> findStationsWithAvailableRobots();
    
    @Query("SELECT s FROM Station s WHERE s.availableDrones > 0")
    List<Station> findStationsWithAvailableDrones();
    
    List<Station> findByAddressId(Long addressId);
}