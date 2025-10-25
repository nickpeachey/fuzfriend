package com.fuzfriend.productsapi.dto;

import java.math.BigDecimal;
import java.util.List;

public class ProductQueryDto {
    private List<Integer> ids;
    private String category; // single category (legacy)
    private List<String> categories;
    private List<String> brands;
    private List<String> colours;
    private List<String> sizes;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Double minRating;
    private Boolean onPromotion;
    private int page = 1;
    private int pageSize = 20;
    private String sortBy;
    private String sortDirection;
    private String query;

    public List<Integer> getIds() { return ids; }
    public void setIds(List<Integer> ids) { this.ids = ids; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<String> getCategories() { return categories; }
    public void setCategories(List<String> categories) { this.categories = categories; }
    public List<String> getBrands() { return brands; }
    public void setBrands(List<String> brands) { this.brands = brands; }
    public List<String> getColours() { return colours; }
    public void setColours(List<String> colours) { this.colours = colours; }
    public List<String> getSizes() { return sizes; }
    public void setSizes(List<String> sizes) { this.sizes = sizes; }
    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }
    public BigDecimal getMaxPrice() { return maxPrice; }
    public void setMaxPrice(BigDecimal maxPrice) { this.maxPrice = maxPrice; }
    public Double getMinRating() { return minRating; }
    public void setMinRating(Double minRating) { this.minRating = minRating; }
    public Boolean getOnPromotion() { return onPromotion; }
    public void setOnPromotion(Boolean onPromotion) { this.onPromotion = onPromotion; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
}
