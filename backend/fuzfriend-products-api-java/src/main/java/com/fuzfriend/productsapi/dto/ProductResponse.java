package com.fuzfriend.productsapi.dto;

import com.fuzfriend.productsapi.model.Product;
import java.util.Collections;
import java.util.List;

public class ProductResponse {
    private List<Product> products = Collections.emptyList();
    private FilterOptions filters = new FilterOptions();
    private int totalCount;

    public List<Product> getProducts() { return products; }
    public void setProducts(List<Product> products) { this.products = products; }
    public FilterOptions getFilters() { return filters; }
    public void setFilters(FilterOptions filters) { this.filters = filters; }
    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }
}
