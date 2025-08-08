package com.flagcamp.delivery.repository;

import com.flagcamp.delivery.entity.Route;
import com.flagcamp.delivery.entity.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    
    Optional<Route> findByOrderId(Long orderId);
    
    List<Route> findByVehicleType(VehicleType vehicleType);
    
    boolean existsByOrderId(Long orderId);
    
    void deleteByOrderId(Long orderId);
}