package com.flagcamp.delivery.repository;

import com.flagcamp.delivery.entity.DeliveryOrder;
import com.flagcamp.delivery.entity.DeliveryOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    
    List<DeliveryOrder> findByUserId(Long userId);
    
    List<DeliveryOrder> findByStatus(DeliveryOrderStatus status);
    
    List<DeliveryOrder> findByVehicleId(Long vehicleId);
    
    List<DeliveryOrder> findByStationId(Long stationId);
    
    @Query("SELECT d FROM DeliveryOrder d WHERE d.userId = :userId ORDER BY d.createdAt DESC")
    List<DeliveryOrder> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    // Add pageable versions
    Page<DeliveryOrder> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    Page<DeliveryOrder> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, DeliveryOrderStatus status, Pageable pageable);
    
    @Query("SELECT d FROM DeliveryOrder d WHERE d.createdAt BETWEEN :startDate AND :endDate")
    List<DeliveryOrder> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);
    
    long countByStatus(DeliveryOrderStatus status);
}