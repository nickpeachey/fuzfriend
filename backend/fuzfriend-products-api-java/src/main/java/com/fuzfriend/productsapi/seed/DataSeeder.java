package com.fuzfriend.productsapi.seed;

import com.fuzfriend.productsapi.model.Product;
import com.fuzfriend.productsapi.repository.ProductRepository;
import com.github.javafaker.Faker;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Component
@Profile("!test")
public class DataSeeder implements ApplicationRunner {

    private final ProductRepository repository;

    public DataSeeder(ProductRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) return;

        String[] categories = {
                "Smartphones", "Laptops", "Headphones", "Footwear", "Accessories",
                "Gaming", "Home Appliances", "Beauty", "Watches", "Cameras"
        };
        String[] brands = {
                "Apple", "Samsung", "Sony", "Nike", "Adidas", "Dell", "HP",
                "LG", "Canon", "Panasonic", "Bose", "JBL", "Microsoft", "Asus", "Lenovo"
        };
        String[] colors = {"Black", "White", "Blue", "Red", "Green", "Silver", "Grey", "Gold"};
        String[] sizes = {"Small", "Medium", "Large", "128GB", "256GB", "512GB", "One Size", "UK 9", "EU 42"};

        Map<String, String[]> categoryImages = new HashMap<>();
        categoryImages.put("Smartphones", new String[] {
                "https://images.pexels.com/photos/1289904/pexels-photo-1289904.jpeg",
                "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg"
        });
        categoryImages.put("Laptops", new String[] {
                "https://images.pexels.com/photos/18105/pexels-photo.jpg",
                "https://images.pexels.com/photos/18106/pexels-photo.jpg"
        });
        categoryImages.put("Headphones", new String[] {
                "https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg",
                "https://images.pexels.com/photos/3394661/pexels-photo-3394661.jpeg"
        });
        categoryImages.put("Footwear", new String[] {
                "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg",
                "https://images.pexels.com/photos/19090/pexels-photo.jpg"
        });
        categoryImages.put("Gaming", new String[] {
                "https://images.pexels.com/photos/907221/pexels-photo-907221.jpeg",
                "https://images.pexels.com/photos/3945659/pexels-photo-3945659.jpeg"
        });
        categoryImages.put("Home Appliances", new String[] {
                "https://images.pexels.com/photos/3737691/pexels-photo-3737691.jpeg",
                "https://images.pexels.com/photos/3737692/pexels-photo-3737692.jpeg"
        });
        categoryImages.put("Beauty", new String[] {
                "https://images.pexels.com/photos/3373747/pexels-photo-3373747.jpeg",
                "https://images.pexels.com/photos/3735639/pexels-photo-3735639.jpeg"
        });
        categoryImages.put("Watches", new String[] {
                "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg",
                "https://images.pexels.com/photos/277319/pexels-photo-277319.jpeg"
        });
        categoryImages.put("Cameras", new String[] {
                "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg",
                "https://images.pexels.com/photos/274973/pexels-photo-274973.jpeg"
        });
        categoryImages.put("Accessories", new String[] {
                "https://images.pexels.com/photos/845434/pexels-photo-845434.jpeg",
                "https://images.pexels.com/photos/845451/pexels-photo-845451.jpeg"
        });

        Faker faker = new Faker();
        List<Product> products = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            Product p = new Product();
            p.setTitle(faker.commerce().productName());
            p.setDescription(faker.lorem().sentence(12));
            p.setBrand(brands[faker.random().nextInt(brands.length)]);
            p.setCategory(categories[faker.random().nextInt(categories.length)]);
            p.setColor(colors[faker.random().nextInt(colors.length)]);
            p.setSize(sizes[faker.random().nextInt(sizes.length)]);
            BigDecimal price = BigDecimal.valueOf(faker.number().randomDouble(2, 10, 2000)).setScale(2, RoundingMode.HALF_UP);
            p.setPrice(price);
            p.setRating(Math.round((faker.number().randomDouble(1, 30, 50) / 10.0) * 10.0) / 10.0);
            p.setOnPromotion(faker.bool().bool());
            String[] imgs = categoryImages.getOrDefault(p.getCategory(), new String[]{
                    "https://picsum.photos/800/800?random=" + faker.number().numberBetween(1, 9999)
            });
            p.setImageUrls(Arrays.asList(imgs));
            products.add(p);
        }
        repository.saveAll(products);
    }
}
