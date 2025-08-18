'use client';

import Image from 'next/image';
import { useState } from 'react';

interface MoviePosterProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export default function MoviePoster({ src, alt, priority = false }: MoviePosterProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackImage = 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop';
  const imageSrc = imageError ? fallbackImage : src;

  return (
    <div className="relative w-full h-full">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
    </div>
  );
} 