export interface Product {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    price: number;
    brand: string;
    color: string;
    size: string;
    rating: number;
    onPromotion: boolean;
    category: string;
}

export interface ProductSearchRequest {
    category?: string;
    categories?: string[];
    brands?: string[];
    colours?: string[];
    sizes?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    onPromotion?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: string;
}

export interface FilterOptions {
    categories: string[];
    brands: string[];
    colours: string[];
    sizes: string[];
    minPrice: number;
    maxPrice: number;
    ratings: number[];
    hasPromotions: boolean;
}

export interface ProductSearchResponse {
    items: Product[];
    totalCount: number;
    filters?: FilterOptions;
}
