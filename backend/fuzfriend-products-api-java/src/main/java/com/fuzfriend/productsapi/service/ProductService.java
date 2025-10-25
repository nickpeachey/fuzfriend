package com.fuzfriend.productsapi.service;

import com.fuzfriend.productsapi.dto.FilterOptions;
import com.fuzfriend.productsapi.dto.ProductQueryDto;
import com.fuzfriend.productsapi.dto.ProductResponse;
import com.fuzfriend.productsapi.model.Product;
import com.fuzfriend.productsapi.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {
    private final ProductRepository repository;

    @PersistenceContext
    private EntityManager em;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ProductResponse getProducts(ProductQueryDto query) {
        if (query == null) query = new ProductQueryDto();
        int page = query.getPage() <= 0 ? 1 : query.getPage();
        int pageSize = query.getPageSize() <= 0 ? 20 : Math.min(query.getPageSize(), 100);

        // Normalize filters
        List<Integer> ids = optionalDistinct(query.getIds());
        List<String> categories = new ArrayList<>();
        if (query.getCategories() != null) categories.addAll(query.getCategories());
        if (query.getCategory() != null && !query.getCategory().isBlank()) categories.add(query.getCategory());
        categories = categories.stream().filter(s -> s != null && !s.isBlank()).distinct().toList();
        List<String> brands = optionalDistinct(query.getBrands());
        List<String> colours = optionalDistinct(query.getColours());
        List<String> sizes = optionalDistinct(query.getSizes());

        BigDecimal minPrice = (query.getMinPrice() != null && query.getMinPrice().compareTo(BigDecimal.ZERO) > 0) ? query.getMinPrice() : null;
        BigDecimal maxPrice = (query.getMaxPrice() != null && query.getMaxPrice().compareTo(BigDecimal.ZERO) > 0) ? query.getMaxPrice() : null;
        if (minPrice != null && maxPrice != null && maxPrice.compareTo(minPrice) < 0) {
            BigDecimal tmp = minPrice; minPrice = maxPrice; maxPrice = tmp;
        }
        Double minRating = (query.getMinRating() != null && query.getMinRating() > 0) ? query.getMinRating() : null;
        Boolean onPromotion = query.getOnPromotion();

        boolean noFilters = (ids == null || ids.isEmpty())
                && (categories == null || categories.isEmpty())
                && (brands == null || brands.isEmpty())
                && (colours == null || colours.isEmpty())
                && (sizes == null || sizes.isEmpty())
                && minPrice == null && maxPrice == null && minRating == null && onPromotion == null
                && (query.getQuery() == null || query.getQuery().isBlank());

        CriteriaBuilder cb = em.getCriteriaBuilder();

        // Base query
        CriteriaQuery<Product> cq = cb.createQuery(Product.class);
        Root<Product> root = cq.from(Product.class);

        List<Predicate> predicates = new ArrayList<>();
        if (ids != null && !ids.isEmpty()) predicates.add(root.get("id").in(ids));
        if (categories != null && !categories.isEmpty()) predicates.add(root.get("category").in(categories));
        if (brands != null && !brands.isEmpty()) predicates.add(root.get("brand").in(brands));
        if (colours != null && !colours.isEmpty()) predicates.add(root.get("color").in(colours));
        if (sizes != null && !sizes.isEmpty()) predicates.add(root.get("size").in(sizes));
        if (query.getQuery() != null && !query.getQuery().isBlank()) {
            String q = "%" + query.getQuery().trim().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), q),
                    cb.like(cb.lower(root.get("description")), q),
                    cb.like(cb.lower(root.get("brand")), q),
                    cb.like(cb.lower(root.get("category")), q)
            ));
        }
        if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        if (minRating != null) predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
        if (onPromotion != null) predicates.add(cb.equal(root.get("onPromotion"), onPromotion));

        if (!predicates.isEmpty()) cq.where(predicates.toArray(new Predicate[0]));

        // Sorting
        String sortBy = (query.getSortBy() == null ? "title" : query.getSortBy().trim().toLowerCase());
        String sortDir = (query.getSortDirection() == null ? "asc" : query.getSortDirection().trim().toLowerCase());
        boolean desc = sortDir.equals("desc") || sortDir.equals("descending");
        Path<?> sortPath = switch (sortBy) {
            case "price" -> root.get("price");
            case "rating" -> root.get("rating");
            case "brand" -> root.get("brand");
            case "category" -> root.get("category");
            default -> root.get("title");
        };
        cq.orderBy(desc ? cb.desc(sortPath) : cb.asc(sortPath));

        // Count
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Product> countRoot = countQuery.from(Product.class);
        if (!predicates.isEmpty()) countQuery.where(predicatesWithRoot(cb, countRoot, ids, categories, brands, colours, sizes, minPrice, maxPrice, minRating, onPromotion, query.getQuery()));
        countQuery.select(cb.count(countRoot));
        long totalCount = em.createQuery(countQuery).getSingleResult();

        // Page
        List<Product> products = em.createQuery(cq.select(root))
                .setFirstResult((page - 1) * pageSize)
                .setMaxResults(pageSize)
                .getResultList();

        // Facets with self-exclusion
        FilterOptions filters = new FilterOptions();

        Map<String, Integer> categoryCounts = groupCounts(cb, "category", ids, null, brands, colours, sizes, minPrice, maxPrice, minRating, onPromotion, query.getQuery());
        Map<String, Integer> brandCounts = groupCounts(cb, "brand", ids, categories, null, colours, sizes, minPrice, maxPrice, minRating, onPromotion, query.getQuery());
        Map<String, Integer> colourCounts = groupCounts(cb, "color", ids, categories, brands, null, sizes, minPrice, maxPrice, minRating, onPromotion, query.getQuery());
        Map<String, Integer> sizeCounts = groupCounts(cb, "size", ids, categories, brands, colours, null, minPrice, maxPrice, minRating, onPromotion, query.getQuery());

        filters.setCategoryCounts(categoryCounts);
        filters.setBrandCounts(brandCounts);
        filters.setColourCounts(colourCounts);
        filters.setSizeCounts(sizeCounts);
        filters.setCategories(categoryCounts.keySet().stream().filter(Objects::nonNull).distinct().sorted().toList());
        filters.setBrands(brandCounts.keySet().stream().filter(Objects::nonNull).distinct().sorted().toList());
        filters.setColours(colourCounts.keySet().stream().filter(Objects::nonNull).distinct().sorted().toList());
        filters.setSizes(sizeCounts.keySet().stream().filter(Objects::nonNull).distinct().sorted().toList());

        // Price range, ratings, promotions
    CriteriaQuery<BigDecimal> minQ = cb.createQuery(BigDecimal.class);
    Root<Product> minRoot = minQ.from(Product.class);
    Predicate[] basePredsForMinMax = predicatesWithRoot(cb, minRoot, ids, categories, brands, colours, sizes, minPrice, maxPrice, minRating, onPromotion, query.getQuery());
    if (basePredsForMinMax.length > 0) minQ.where(basePredsForMinMax);
    minQ.select(cb.min(minRoot.get("price")));
    BigDecimal priceMin = queryResultOrZero(em.createQuery(minQ).setMaxResults(1).getResultList());

    CriteriaQuery<BigDecimal> maxQ = cb.createQuery(BigDecimal.class);
    Root<Product> maxRoot = maxQ.from(Product.class);
    Predicate[] basePredsForMax = predicatesWithRoot(cb, maxRoot, ids, categories, brands, colours, sizes, minPrice, maxPrice, minRating, onPromotion, query.getQuery());
    if (basePredsForMax.length > 0) maxQ.where(basePredsForMax);
    maxQ.select(cb.max(maxRoot.get("price")));
    BigDecimal priceMax = queryResultOrZero(em.createQuery(maxQ).setMaxResults(1).getResultList());

        filters.setMinPrice(priceMin);
        filters.setMaxPrice(priceMax);

        // Ratings
        CriteriaQuery<Double> ratingsQ = cb.createQuery(Double.class);
        Root<Product> rRoot = ratingsQ.from(Product.class);
        if (!predicates.isEmpty()) ratingsQ.where(predicatesWithRoot(cb, rRoot, ids, categories, brands, colours, sizes, minPrice, maxPrice, minRating, onPromotion, query.getQuery()));
        ratingsQ.select(rRoot.get("rating")).distinct(true);
    List<Double> distinctRatings = em.createQuery(ratingsQ).getResultList();
    List<Integer> floorRatings = distinctRatings.stream()
        .map(d -> (int) Math.floor(d))
        .distinct()
        .sorted()
        .toList();
        filters.setRatings(floorRatings);

        // Promotions
    CriteriaQuery<Long> promoQ = cb.createQuery(Long.class);
    Root<Product> pRoot = promoQ.from(Product.class);
    List<Predicate> promoPreds = new ArrayList<>(Arrays.asList(predicatesWithRoot(cb, pRoot, ids, categories, brands, colours, sizes, minPrice, maxPrice, minRating, onPromotion, query.getQuery())));
    promoPreds.add(cb.equal(pRoot.get("onPromotion"), true));
    promoQ.select(cb.count(pRoot));
    if (!promoPreds.isEmpty()) promoQ.where(promoPreds.toArray(new Predicate[0]));
    long promoCount = em.createQuery(promoQ).getSingleResult();
        filters.setHasPromotions(promoCount > 0);

        ProductResponse resp = new ProductResponse();
        resp.setProducts(products);
        resp.setTotalCount((int) totalCount);
        resp.setFilters(filters);
        return resp;
    }

    @Transactional(readOnly = true)
    public Optional<Product> getProductById(int id) {
        return repository.findById(id);
    }

    private Predicate[] predicatesWithRoot(CriteriaBuilder cb, Root<Product> root,
                                           List<Integer> ids,
                                           List<String> categories,
                                           List<String> brands,
                                           List<String> colours,
                                           List<String> sizes,
                                           BigDecimal minPrice, BigDecimal maxPrice,
                                           Double minRating, Boolean onPromotion,
                                           String queryText) {
        List<Predicate> p = new ArrayList<>();
        if (ids != null && !ids.isEmpty()) p.add(root.get("id").in(ids));
        if (categories != null && !categories.isEmpty()) p.add(root.get("category").in(categories));
        if (brands != null && !brands.isEmpty()) p.add(root.get("brand").in(brands));
        if (colours != null && !colours.isEmpty()) p.add(root.get("color").in(colours));
        if (sizes != null && !sizes.isEmpty()) p.add(root.get("size").in(sizes));
        if (queryText != null && !queryText.isBlank()) {
            String q = "%" + queryText.trim().toLowerCase() + "%";
            p.add(cb.or(
                    cb.like(cb.lower(root.get("title")), q),
                    cb.like(cb.lower(root.get("description")), q),
                    cb.like(cb.lower(root.get("brand")), q),
                    cb.like(cb.lower(root.get("category")), q)
            ));
        }
        if (minPrice != null) p.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        if (maxPrice != null) p.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        if (minRating != null) p.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
        if (onPromotion != null) p.add(cb.equal(root.get("onPromotion"), onPromotion));
        return p.toArray(new Predicate[0]);
    }

    private Map<String, Integer> groupCounts(CriteriaBuilder cb, String field,
                                             List<Integer> ids,
                                             List<String> categories,
                                             List<String> brands,
                                             List<String> colours,
                                             List<String> sizes,
                                             BigDecimal minPrice, BigDecimal maxPrice,
                                             Double minRating, Boolean onPromotion,
                                             String queryText) {
        CriteriaQuery<Object[]> q = cb.createQuery(Object[].class);
        Root<Product> root = q.from(Product.class);
        Path<String> path = root.get(field);
        q.multiselect(path, cb.count(root));
        q.groupBy(path);
        q.where(predicatesWithRoot(cb, root, ids, categories, brands, colours, sizes, minPrice, maxPrice, minRating, onPromotion, queryText));
        List<Object[]> rows = em.createQuery(q).getResultList();
        return rows.stream()
                .filter(r -> r[0] != null)
                .collect(Collectors.toMap(r -> (String) r[0], r -> ((Long) r[1]).intValue()));
    }

    private static <T> List<T> optionalDistinct(List<T> list) {
        return (list == null) ? null : list.stream().filter(Objects::nonNull).map(v -> {
            if (v instanceof String s) return (T) s.trim();
            return v;
        }).filter(v -> !(v instanceof String s) || !s.isBlank()).distinct().toList();
    }

    private static BigDecimal queryResultOrZero(List<BigDecimal> list) {
        return list == null || list.isEmpty() || list.get(0) == null ? BigDecimal.ZERO : list.get(0);
    }
}
