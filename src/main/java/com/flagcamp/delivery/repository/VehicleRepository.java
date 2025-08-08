package com.flagcamp.delivery.repository;

import com.flagcamp.delivery.entity.Vehicle;
import com.flagcamp.delivery.entity.VehicleStatus;
import com.flagcamp.delivery.entity.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    
    List<Vehicle> findByVehicleType(VehicleType vehicleType);
    
    List<Vehicle> findByStatus(VehicleStatus status);
    
    List<Vehicle> findByStationId(Long stationId);
    
    List<Vehicle> findByVehicleTypeAndStatus(VehicleType vehicleType, VehicleStatus status);
    
    List<Vehicle> findByStationIdAndStatus(Long stationId, VehicleStatus status);
}