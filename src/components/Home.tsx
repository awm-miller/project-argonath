import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Mic, ChevronLeft, ChevronRight, Package, Search, Video } from 'lucide-react';

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
    description: 'Explore our comprehensive database of profiles with advanced search capabilities and tag-based filtering.',
    icon: <Sun className="w-10 h-10" />,
    path: '/sunlight',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'transcriber',
    name: 'Audio Transcriber',
    description: 'Convert audio and video files to text with our advanced transcription service. Supports multiple file formats and online videos.',
    icon: <Mic className="w-10 h-10" />,
    path: '/transcriber',
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'bundle',
    name: 'Bundle OSINT',
    description: 'One search bar for all your OSINT needs. Search across multiple platforms and data sources simultaneously.',
    icon: <Package className="w-10 h-10" />,
    path: '/bundle',
    color: 'from-green-400 to-emerald-500'
  },
  {
    id: 'ai-search',
    name: 'AI Search',
    description: 'Intelligent search through our vast knowledge base using advanced AI to find exactly what you need.',
    icon: <Search className="w-10 h-10" />,
    path: '/ai-search',
    color: 'from-purple-400 to-violet-500'
  },
  {
    id: 'weezr',
    name: 'Weezr',
    description: 'Advanced facial recognition tool for video analysis. Find and track faces across video content.',
    icon: <Video className="w-10 h-10" />,
    path: '/weezr',
    color: 'from-red-400 to-rose-500'
  }
];

function Home() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const nextCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % tools.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + tools.length) % tools.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Argonath
          </h1>
          <p className="text-xl text-gray-600">
            Project Argonath is a best-in-class suite of tools and searches over the best knowledge in the field.
          </p>
        </div>

        <div className="relative max-w-md mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevCard}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-10"
            aria-label="Previous tool"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={nextCard}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-10"
            aria-label="Next tool"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Cards Container */}
          <div className="relative h-[320px] perspective-1000">
            {tools.map((tool, index) => {
              const isActive = index === currentIndex;
              const isPrev = (index === currentIndex - 1) || (currentIndex === 0 && index === tools.length - 1);
              const isNext = (index === currentIndex + 1) || (currentIndex === tools.length - 1 && index === 0);

              return (
                <div
                  key={tool.id}
                  className={`absolute w-full transition-all duration-500 ease-in-out ${
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
                    className="bg-white rounded-xl shadow-xl overflow-hidden cursor-pointer transform transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {/* Card Header */}
                    <div className={`bg-gradient-to-r ${tool.color} p-6`}>
                      <div className="flex justify-center">
                        <div className="bg-white/10 backdrop-blur-lg rounded-full p-3">
                          {React.cloneElement(tool.icon as React.ReactElement, {
                            className: "w-10 h-10 text-white"
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
                        <span className="inline-flex items-center text-sm text-blue-600 font-medium hover:text-blue-800">
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
                    setCurrentIndex(index);
                    setTimeout(() => setIsAnimating(false), 500);
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