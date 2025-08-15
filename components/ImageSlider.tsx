'use client';

import { useState, useEffect } from 'react';

interface ImageSliderProps {
  images: {
    src: string;
    alt: string;
    title?: string;
    description?: string;
  }[];
  autoPlay?: boolean;
  interval?: number;
}

export default function ImageSlider({ 
  images, 
  autoPlay = true, 
  interval = 5000 
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-3xl shadow-2xl border-4 border-white">
      {/* Main Image */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            {/* Enhanced Overlay with text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end">
              <div className="p-8 md:p-12 text-white w-full">
                {image.title && (
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
                    {image.title}
                  </h3>
                )}
                {image.description && (
                  <p className="text-lg md:text-xl opacity-95 max-w-2xl font-medium leading-relaxed drop-shadow-md">
                    {image.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110 shadow-lg border-2 border-white/20"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110 shadow-lg border-2 border-white/20"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Enhanced Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 ${
              index === currentIndex 
                ? 'bg-white scale-125 shadow-lg' 
                : 'bg-white/60 hover:bg-white/80 hover:scale-110'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Enhanced Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-black/30 backdrop-blur-sm">
        <div 
          className="h-full bg-white transition-all duration-300 ease-linear shadow-lg"
          style={{ 
            width: `${((currentIndex + 1) / images.length) * 100}%` 
          }}
        />
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
