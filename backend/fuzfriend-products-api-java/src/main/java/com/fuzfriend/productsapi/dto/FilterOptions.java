package com.fuzfriend.productsapi.dto;

import java.math.BigDecimal;
import java.util.*;

public class FilterOptions {
    private List<String> categories = new ArrayList<>();
    private List<String> brands = new ArrayList<>();
    private List<String> colours = new ArrayList<>();
    private List<String> sizes = new ArrayList<>();
    private Map<String, Integer> categoryCounts = new HashMap<>();
    private Map<String, Integer> brandCounts = new HashMap<>();
    private Map<String, Integer> colourCounts = new HashMap<>();
    private Map<String, Integer> sizeCounts = new HashMap<>();
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private List<Integer> ratings = new ArrayList<>();
    private boolean hasPromotions;

    public List<String> getCategories() { return categories; }
    public void setCategories(List<String> categories) { this.categories = categories; }
    public List<String> getBrands() { return brands; }
    public void setBrands(List<String> brands) { this.brands = brands; }
    public List<String> getColours() { return colours; }
    public void setColours(List<String> colours) { this.colours = colours; }
    public List<String> getSizes() { return sizes; }
    public void setSizes(List<String> sizes) { this.sizes = sizes; }
    public Map<String, Integer> getCategoryCounts() { return categoryCounts; }
    public void setCategoryCounts(Map<String, Integer> categoryCounts) { this.categoryCounts = categoryCounts; }
    public Map<String, Integer> getBrandCounts() { return brandCounts; }
    public void setBrandCounts(Map<String, Integer> brandCounts) { this.brandCounts = brandCounts; }
    public Map<String, Integer> getColourCounts() { return colourCounts; }
    public void setColourCounts(Map<String, Integer> colourCounts) { this.colourCounts = colourCounts; }
    public Map<String, Integer> getSizeCounts() { return sizeCounts; }
    public void setSizeCounts(Map<String, Integer> sizeCounts) { this.sizeCounts = sizeCounts; }
    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }
    public BigDecimal getMaxPrice() { return maxPrice; }
    public void setMaxPrice(BigDecimal maxPrice) { this.maxPrice = maxPrice; }
    public List<Integer> getRatings() { return ratings; }
    public void setRatings(List<Integer> ratings) { this.ratings = ratings; }
    public boolean isHasPromotions() { return hasPromotions; }
    public void setHasPromotions(boolean hasPromotions) { this.hasPromotions = hasPromotions; }
}
