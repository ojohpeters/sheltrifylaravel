import { ReactNode } from "react";

export interface Artisan {
  id: number;
  name: string;
  service: string;
  email: string;
  phone: string;
  avatarUrl: string;
}

export interface Property {
  id: number;
  title: string;
  imageUrl: string;
  price: string;
  location: string;
  bedrooms?: number;
  amenities?: string[];
  propertyType?: string;
  isFavorite?: boolean;
  isLoadingImage?: boolean;
  videoUrl?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  property?: Property;
  suggestions?: string[];
  artisans?: Artisan[];
}

export interface FilterValues {
    priceRange: { min: number; max: number };
    bedrooms: number | 'any';
    propertyType: string;
    amenities: string[];
}

export interface User {
    name: string;
    isPremium: boolean;
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface Feel {
    id: number;
    author: { name: string; handle: string; avatarUrl: string };
    videoUrl: string;
    caption: string;
    music: string;
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
}

export interface AIRecommendation {
    title: string;
    caption: string;
    imageUrl?: string;
}
