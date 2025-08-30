package com.SmartHireX.repository;

import com.SmartHireX.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Boolean existsByEmail(String email);
    Boolean existsByEmailIgnoreCase(String email);

    List<User> findByRoleIgnoreCaseOrderByCreatedAtDesc(String role);

    @Query("select u from User u where lower(u.firstName) like lower(concat('%', :q, '%')) or lower(u.lastName) like lower(concat('%', :q, '%')) or lower(u.email) like lower(concat('%', :q, '%'))")
    List<User> searchUsers(@Param("q") String query);
}
