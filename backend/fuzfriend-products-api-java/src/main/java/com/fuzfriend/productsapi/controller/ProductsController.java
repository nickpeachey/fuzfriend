package com.fuzfriend.productsapi.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fuzfriend.productsapi.dto.ProductQueryDto;
import com.fuzfriend.productsapi.dto.ProductResponse;
import com.fuzfriend.productsapi.model.Product;
import com.fuzfriend.productsapi.service.CacheService;
import com.fuzfriend.productsapi.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductsController {
    private final ProductService service;
    private final CacheService cache;
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .setPropertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    public ProductsController(ProductService service, CacheService cache) {
        this.service = service;
        this.cache = cache;
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).toUpperCase();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    private static String buildSearchKey(ProductQueryDto query) {
        try {
            String json = MAPPER.writeValueAsString(query == null ? new ProductQueryDto() : query);
            return "Products:Search:" + sha256(json);
        } catch (JsonProcessingException e) {
            return "Products:Search:ERR";
        }
    }

    private static boolean shouldBypassCache(HttpServletRequest request) {
        String bypass = request.getHeader("X-Bypass-Cache");
        String cacheControl = request.getHeader("Cache-Control");
        String pragma = request.getHeader("Pragma");
        return (bypass != null && bypass.equalsIgnoreCase("1"))
                || (cacheControl != null && cacheControl.toLowerCase().contains("no-cache"))
                || (pragma != null && pragma.toLowerCase().contains("no-cache"));
    }

    @GetMapping
    public ResponseEntity<ProductResponse> getProducts(@RequestParam(defaultValue = "1") int page,
                                                       @RequestParam(defaultValue = "20") int pageSize,
                                                       HttpServletRequest request) throws JsonProcessingException {
        boolean bypass = shouldBypassCache(request);
        String cacheKey = "Products:Get:page=" + page + ";pageSize=" + pageSize;
        if (!bypass) {
            String cached = cache.get(cacheKey);
            if (cached != null && !cached.isBlank()) {
                ProductResponse resp = MAPPER.readValue(cached, ProductResponse.class);
                return ResponseEntity.ok()
                        .header("X-Cache-Status", "HIT")
                        .header("X-Cache-Key", cacheKey)
                        .body(resp);
            }
        }
        ProductQueryDto q = new ProductQueryDto();
        q.setPage(page);
        q.setPageSize(pageSize);
        ProductResponse result = service.getProducts(q);

        if (!bypass) {
            cache.set(cacheKey, MAPPER.writeValueAsString(result));
            return ResponseEntity.ok()
                    .header("X-Cache-Status", "MISS")
                    .header("X-Cache-Key", cacheKey)
                    .body(result);
        } else {
            return ResponseEntity.ok()
                    .header("X-Cache-Status", "BYPASS")
                    .body(result);
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getProductsCount(HttpServletRequest request) {
        boolean bypass = shouldBypassCache(request);
        String cacheKey = "Products:Count";
        if (!bypass) {
            String cached = cache.get(cacheKey);
            if (cached != null && !cached.isBlank()) {
                try {
                    int count = Integer.parseInt(cached);
                    return ResponseEntity.ok()
                            .header("X-Cache-Status", "HIT")
                            .header("X-Cache-Key", cacheKey)
                            .body(count);
                } catch (NumberFormatException ignored) {}
            }
        }
        ProductResponse result = service.getProducts(new ProductQueryDto());
        if (!bypass) {
            cache.set(cacheKey, Integer.toString(result.getTotalCount()));
            return ResponseEntity.ok()
                    .header("X-Cache-Status", "MISS")
                    .header("X-Cache-Key", cacheKey)
                    .body(result.getTotalCount());
        } else {
            return ResponseEntity.ok()
                    .header("X-Cache-Status", "BYPASS")
                    .body(result.getTotalCount());
        }
    }

    @PostMapping("/search")
    public ResponseEntity<ProductResponse> searchProducts(@RequestBody(required = false) ProductQueryDto query,
                                                          HttpServletRequest request) throws JsonProcessingException {
        boolean bypass = shouldBypassCache(request);
        String cacheKey = buildSearchKey(query);
        if (!bypass) {
            String cached = cache.get(cacheKey);
            if (cached != null && !cached.isBlank()) {
                ProductResponse resp = MAPPER.readValue(cached, ProductResponse.class);
                return ResponseEntity.ok()
                        .header("X-Cache-Status", "HIT")
                        .header("X-Cache-Key", cacheKey)
                        .body(resp);
            }
        }
        ProductResponse result = service.getProducts(query);
        if (!bypass) {
            cache.set(cacheKey, MAPPER.writeValueAsString(result));
            return ResponseEntity.ok()
                    .header("X-Cache-Status", "MISS")
                    .header("X-Cache-Key", cacheKey)
                    .body(result);
        } else {
            return ResponseEntity.ok()
                    .header("X-Cache-Status", "BYPASS")
                    .body(result);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable int id, HttpServletRequest request) throws JsonProcessingException {
        boolean bypass = shouldBypassCache(request);
        String cacheKey = "Products:GetById:" + id;
        if (!bypass) {
            String cached = cache.get(cacheKey);
            if (cached != null && !cached.isBlank()) {
                Product prod = MAPPER.readValue(cached, Product.class);
                return ResponseEntity.ok()
                        .header("X-Cache-Status", "HIT")
                        .header("X-Cache-Key", cacheKey)
                        .header("X-Requested-Id", Integer.toString(id))
                        .header("X-Returned-Id", prod.getId() == null ? "" : prod.getId().toString())
                        .body(prod);
            }
        }
        Optional<Product> maybe = service.getProductById(id);
        if (maybe.isEmpty()) return ResponseEntity.notFound().build();
        Product product = maybe.get();

        if (!bypass) {
            cache.set(cacheKey, MAPPER.writeValueAsString(product));
            return ResponseEntity.ok()
                    .header("X-Cache-Status", "MISS")
                    .header("X-Cache-Key", cacheKey)
                    .header("X-Requested-Id", Integer.toString(id))
                    .header("X-Returned-Id", product.getId() == null ? "" : product.getId().toString())
                    .body(product);
        } else {
            return ResponseEntity.ok()
                    .header("X-Cache-Status", "BYPASS")
                    .header("X-Requested-Id", Integer.toString(id))
                    .header("X-Returned-Id", product.getId() == null ? "" : product.getId().toString())
                    .body(product);
        }
    }
}
