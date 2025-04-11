import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Mic,
  ChevronLeft,
  ChevronRight,
  Network,
  Waves,
  Archive,
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const tools: Tool[] = [
  {
    id: 'sunlight',
    name: 'Sunlight Database',
    description:
      'Explore our comprehensive database of profiles with advanced search capabilities and tag-based filtering.',
    icon: <Sun className="w-10 h-10" />,
    path: '/sunlight',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'transcriber',
    name: 'Transcriber Helper',
    description:
      'Tired of buggy sites with loads of ads to download? This tool downloads, converts and archives your content quickly and painlessly.',
    icon: <Mic className="w-10 h-10" />,
    path: '/transcriber',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'connections',
    name: 'Connections',
    description:
      'Visualize and analyze relationships between profiles with our advanced link analysis builder.',
    icon: <Network className="w-10 h-10" />,
    path: '/connections',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'reverberate',
    name: 'Reverberate',
    description:
      'Rapidly search through lists of names with keywords to find meaningful connections and patterns.',
    icon: <Waves className="w-10 h-10" />,
    path: '/reverberate',
    color: 'from-green-400 to-teal-500',
  },
  {
    id: 'archive',
    name: 'Internet Archive',
    description:
      'Search and retrieve content from the Internet Archive with ease.',
    icon: <Archive className="w-10 h-10" />,
    path: '/archive',
    color: 'from-gray-700 to-gray-300',
  },
];

function Home() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [direction, setDirection] = React.useState<'next' | 'prev' | null>(
    null
  );

  const nextCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % tools.length);
    setTimeout(() => {
      setIsAnimating(false);
      setDirection(null);
    }, 500);
  };

  const prevCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + tools.length) % tools.length);
    setTimeout(() => {
      setIsAnimating(false);
      setDirection(null);
    }, 500);
  };

  React.useEffect(() => {
    const interval = setInterval(nextCard, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, isAnimating]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
            Argonath
          </h1>
          <p className="text-xl text-gray-600 animate-fade-in-delayed">
            Project Argonath is a best-in-class suite of tools and searches over
            the best knowledge in the field.
          </p>
        </div>

        <div className="relative max-w-md mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevCard}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-10 transform transition-transform hover:scale-110"
            aria-label="Previous tool"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={nextCard}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-10 transform transition-transform hover:scale-110"
            aria-label="Next tool"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Cards Container */}
          <div className="relative h-[320px] perspective-1000">
            {tools.map((tool, index) => {
              const isActive = index === currentIndex;
              const isPrev =
                index === currentIndex - 1 ||
                (currentIndex === 0 && index === tools.length - 1);
              const isNext =
                index === currentIndex + 1 ||
                (currentIndex === tools.length - 1 && index === 0);

              return (
                <div
                  key={tool.id}
                  className={`absolute w-full transition-all duration-500 ease-in-out transform-gpu ${
                    isActive
                      ? 'opacity-100 scale-100 translate-x-0 rotate-y-0 z-20'
                      : isPrev
                      ? 'opacity-0 scale-90 -translate-x-full -rotate-y-12 z-10'
                      : isNext
                      ? 'opacity-0 scale-90 translate-x-full rotate-y-12 z-10'
                      : 'opacity-0 scale-80 translate-x-0 z-0'
                  }`}
                >
                  <div
                    onClick={() => navigate(tool.path)}
                    className="bg-white rounded-xl shadow-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    {/* Card Header */}
                    <div
                      className={`bg-gradient-to-r ${tool.color} p-6 relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex justify-center relative z-10">
                        <div className="bg-white/10 backdrop-blur-lg rounded-full p-3 transform transition-transform hover:scale-110">
                          {React.cloneElement(tool.icon as React.ReactElement, {
                            className: 'w-10 h-10 text-white',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-gray-600 text-center">
                        {tool.description}
                      </p>
                      <div className="mt-6 flex justify-center">
                        <span className="inline-flex items-center text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors">
                          Get Started
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center mt-6 gap-2">
            {tools.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setDirection(index > currentIndex ? 'next' : 'prev');
                    setCurrentIndex(index);
                    setTimeout(() => {
                      setIsAnimating(false);
                      setDirection(null);
                    }, 500);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-blue-600 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to tool ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
