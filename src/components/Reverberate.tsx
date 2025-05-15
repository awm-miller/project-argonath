import React from 'react';

interface Category {
  id: string;
  label: string;
  keywords: string[];
  tooltip: string;
}

const categories: Category[] = [
  {
    id: 'antisemite',
    label: 'Antisemite',
    keywords: ['Jews', 'Zionists', 'Zios', 'Jewish', 'Holocaust'],
    tooltip: 'Identifies content expressing prejudice or hostility against Jewish people'
  },
  {
    id: 'anti-israel',
    label: 'Anti-Israel',
    keywords: ['Hamas', 'Bibi', 'Netanyahu', 'Genocide', 'Gaza'],
    tooltip: 'Detects extreme or hostile positions regarding the State of Israel'
  },
  {
    id: 'criminal',
    label: 'Criminal',
    keywords: ['Arrest', 'Convicted', 'Prison', 'Jail', 'Crime'],
    tooltip: 'Finds references to criminal activities or legal troubles'
  },
  {
    id: 'far-left',
    label: 'Far Left',
    keywords: ['Communist', 'Marxist', 'Socialist', 'Revolution', 'Radical'],
    tooltip: 'Identifies associations with extreme left-wing ideologies'
  },
  {
    id: 'far-right',
    label: 'Far Right',
    keywords: ['Nationalist', 'Fascist', 'Nazi', 'White supremacy', 'Alt-right'],
    tooltip: 'Detects connections to extreme right-wing movements'
  },
  {
    id: 'sexual',
    label: 'Sexual',
    keywords: ['Harassment', 'Assault', 'Abuse', 'Misconduct', 'Inappropriate'],
    tooltip: 'Identifies references to sexual misconduct or inappropriate behavior'
  }
];

const Reverberate: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div 
            key={category.id}
            className="bg-gray-800 p-4 rounded-lg"
            title={category.tooltip}
          >
            <h2 className="text-xl font-semibold mb-2">{category.label}</h2>
            <div className="flex flex-wrap gap-2">
              {category.keywords.map((keyword) => (
                <span 
                  key={keyword}
                  className="bg-gray-700 px-2 py-1 rounded text-sm"
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