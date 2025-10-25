package com.fuzfriend.productsapi.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CacheService {
    @Autowired(required = false)
    @Nullable
    private StringRedisTemplate redisTemplate; // optional when Redis not configured

    private final Map<String, String> memoryCache = new ConcurrentHashMap<>();
    private final Duration ttl;

    public CacheService(@Value("${app.cache.ttl-seconds:120}") int ttlSeconds) {
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    public String get(String key) {
        if (redisTemplate != null) {
            return redisTemplate.opsForValue().get(key);
        }
        return memoryCache.get(key);
    }

    public void set(String key, String value) {
        if (redisTemplate != null) {
            redisTemplate.opsForValue().set(key, value, ttl);
        } else {
            memoryCache.put(key, value);
        }
    }
}
