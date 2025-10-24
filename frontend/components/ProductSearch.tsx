'use client';

import React, { useEffect, useState } from "react";
import {
    useSearchProductsMutation,
    useGetCategoriesQuery,
    useGetBrandsQuery,
} from "../services/productsApi";
import { Product } from "../types/Product";

export default function ProductSearch() {
    // Start with no selected filters so initial request returns all products
    const [filters, setFilters] = useState({ category: "", brand: "", minPrice: 0, maxPrice: 0 });

    const { data: categories } = useGetCategoriesQuery();
    const { data: brands } = useGetBrandsQuery();
    const [searchProducts, { data, isLoading }] = useSearchProductsMutation();

    // On first load, fetch all products with no filters applied
    useEffect(() => {
        searchProducts({ page: 1, pageSize: 20, sortBy: "title", sortDirection: "asc" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        searchProducts({
            ...filters,
            categories: filters.category ? [filters.category] : [],
            brands: filters.brand ? [filters.brand] : [],
            // 0 values are treated as "not set" by the API; omit maxPrice if 0
            maxPrice: filters.maxPrice && filters.maxPrice > 0 ? filters.maxPrice : undefined,
            minPrice: filters.minPrice && filters.minPrice > 0 ? filters.minPrice : undefined,
            page: 1,
            pageSize: 20,
            sortBy: "price",
            sortDirection: "asc",
        });
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-4">
                <select className="border p-2 rounded" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                    <option value="">All Categories</option>
                    {categories?.map((cat) => <option key={cat}>{cat}</option>)}
                </select>
                <select className="border p-2 rounded" value={filters.brand} onChange={(e) => setFilters({ ...filters, brand: e.target.value })}>
                    <option value="">All Brands</option>
                    {brands?.map((b) => <option key={b}>{b}</option>)}
                </select>
                <input type="number" placeholder="Min Price" className="border p-2 rounded" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: +e.target.value })} />
                <input type="number" placeholder="Max Price" className="border p-2 rounded" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: +e.target.value })} />
            </div>

            <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-2 rounded">Search</button>

            <div className="grid grid-cols-4 gap-4 mt-6">
                {isLoading && <p>Loading...</p>}
                {data?.items.map((p: Product) => (
                    <div key={p.id} className="border rounded p-2 hover:shadow">
                        <div className="font-semibold mt-2">{p.id}</div>
                        <img src={p.imageUrl} alt={p.title} className="w-full h-48 object-cover rounded" />
                        <h3 className="font-semibold mt-2">{p.title}</h3>
                        <p className="text-sm text-gray-500">{p.description}</p>
                        <p className="text-blue-600 font-bold mt-1">£{p.price}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
