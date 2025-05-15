import React from 'react';
import { categories } from './categories';

const Reverberate: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div 
            key={category.id}
            className="bg-gray-800 rounded-lg p-4 shadow-lg"
            title={category.tooltip}
          >
            <h2 className="text-xl font-semibold mb-2">{category.label}</h2>
            <div className="flex flex-wrap gap-2">
              {category.keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="bg-gray-700 px-2 py-1 rounded-md text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reverberate;