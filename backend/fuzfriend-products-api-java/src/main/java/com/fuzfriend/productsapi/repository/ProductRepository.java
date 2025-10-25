package com.fuzfriend.productsapi.repository;

import com.fuzfriend.productsapi.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Integer> {
}
