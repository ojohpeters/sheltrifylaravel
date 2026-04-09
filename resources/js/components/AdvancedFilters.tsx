import React, { useState } from 'react';
import { FilterValues } from '../types';

interface AdvancedFiltersProps {
    onApplyFilters: (filters: FilterValues) => void;
}

const propertyTypes = ["Any", "Apartment", "Duplex", "Bungalow", "Terrace", "Penthouse"];
const amenitiesList = ["Pool", "Gym", "Parking", "WiFi", "Security", "Air Conditioning"];
const bedroomOptions = ['any', 1, 2, 3, 4, 5];

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ onApplyFilters }) => {
    const [priceRange, setPriceRange] = useState({ min: 500000, max: 5000000 });
    const [bedrooms, setBedrooms] = useState<number | 'any'>('any');
    const [propertyType, setPropertyType] = useState('Any');
    const [amenities, setAmenities] = useState<string[]>([]);

    const handleAmenityChange = (amenity: string) => {
        setAmenities(prev => 
            prev.includes(amenity) 
                ? prev.filter(a => a !== amenity) 
                : [...prev, amenity]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApplyFilters({
            priceRange,
            bedrooms,
            propertyType: propertyType === 'Any' ? 'any' : propertyType,
            amenities,
        });
    };
    
    const formatPrice = (value: number) => {
        return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${Math.round(value / 1000)}k`;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Price Range */}
            <div>
                <label className="block font-semibold mb-2 text-light-text-primary dark:text-dark-text-primary">Price Range (NGN)</label>
                <div className="text-center font-medium text-brand-primary mb-2">
                    Up to {formatPrice(priceRange.max)}
                </div>
                <input
                    type="range"
                    min="500000"
                    max="10000000"
                    step="100000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                    className="w-full h-2 bg-light-border dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
            </div>
            {/* Bedrooms */}
            <div>
                 <label className="block font-semibold mb-2 text-light-text-primary dark:text-dark-text-primary">Bedrooms</label>
                 <div className="grid grid-cols-3 gap-2">
                    {bedroomOptions.map(option => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setBedrooms(option)}
                            className={`px-2 py-1.5 rounded-md text-center font-semibold transition-colors ${bedrooms === option ? 'bg-brand-primary text-white' : 'bg-light-bg dark:bg-dark-bg hover:bg-light-border dark:hover:bg-dark-border'}`}
                        >
                            {option === 'any' ? 'Any' : `${option}+`}
                        </button>
                    ))}
                 </div>
            </div>
            {/* Property Type */}
            <div>
                 <label htmlFor="propertyType" className="block font-semibold mb-1 text-light-text-primary dark:text-dark-text-primary">Property Type</label>
                 <select
                    id="propertyType"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:outline-none"
                 >
                    {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
                 </select>
            </div>
             {/* Amenities */}
            <div>
                 <label className="block font-semibold mb-2 text-light-text-primary dark:text-dark-text-primary">Amenities</label>
                 <div className="grid grid-cols-2 gap-2">
                    {amenitiesList.map(amenity => (
                        <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={amenities.includes(amenity)}
                                onChange={() => handleAmenityChange(amenity)}
                                className="h-4 w-4 rounded border-light-border dark:border-dark-border text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">{amenity}</span>
                        </label>
                    ))}
                 </div>
            </div>
            
            <button
                type="submit"
                className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-secondary transition-colors"
            >
                Apply Filters
            </button>
        </form>
    );
};

export default AdvancedFilters;
