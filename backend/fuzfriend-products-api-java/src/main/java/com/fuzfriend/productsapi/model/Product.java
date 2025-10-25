package com.fuzfriend.productsapi.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank
    private String brand;

    @NotBlank
    private String category;

    private String color;

    private String size;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    private double rating;

    private boolean onPromotion;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_image_urls", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    @Fetch(FetchMode.SUBSELECT)
    private List<String> imageUrls = new ArrayList<>();

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public boolean isOnPromotion() { return onPromotion; }
    public void setOnPromotion(boolean onPromotion) { this.onPromotion = onPromotion; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
}
