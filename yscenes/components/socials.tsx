import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useShareModal } from '../hooks/useShareModal';

interface Movie {
  title: string;
  year: number;
  description: string;
  rating_out_of_10: number;
  poster_url?: string;
}

interface SocialsButtonProps {
  movies?: Movie[];
  mood?: string;
  username?: string;
}

const SocialsButton = ({ movies = [], mood = "", username = "User" }: SocialsButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescriptionStep, setIsDescriptionStep] = useState(false);
  const [cardColor, setCardColor] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('#movies #recommendations #mood #yscenes');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reorderedMovies, setReorderedMovies] = useState<Movie[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [isPostingStep, setIsPostingStep] = useState(false);
  
  // Debug state changes
  useEffect(() => {
    console.log('isDescriptionStep changed to:', isDescriptionStep);
    console.log('isModalOpen:', isModalOpen);
    console.log('isPostingStep:', isPostingStep);
  }, [isDescriptionStep, isModalOpen, isPostingStep]);
  
  const dragRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Share modal hook
  const { createLink, copyLink, openFromURLOnMount } = useShareModal(
    movies,
    mood,
    username,
    cardColor,
    isModalOpen,
    setIsModalOpen,
    setReorderedMovies
  );

  // Generate random vibrant color for the card
  const generateRandomColor = () => {
    const colors = [
      'from-red-500/40 to-pink-500/40',
      'from-green-500/40 to-emerald-500/40', 
      'from-blue-500/40 to-indigo-500/40',
      'from-purple-500/40 to-violet-500/40',
      'from-orange-500/40 to-yellow-500/40',
      'from-teal-500/40 to-cyan-500/40',
      'from-rose-500/40 to-red-500/40',
      'from-lime-500/40 to-green-500/40'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const blurMoviePoster = async (posterUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply blur effect using canvas filters
        ctx.filter = 'blur(20px) brightness(0.3)';
        ctx.drawImage(img, 0, 0);

        // Convert to data URL
        const blurredImageUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(blurredImageUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = posterUrl;
    });
  };

  const captureAndBlurBackground = async (movieList: Movie[] = movies) => {
    try {
      // Get the top movie from the provided list (or original movies if no reordering)
      const topMovie = movieList.length > 0 ? movieList[0] : null;
      
      if (topMovie && topMovie.poster_url) {
        // Use the server-side API to avoid CORS issues
        const response = await fetch('/api/blur-movie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            posterUrl: topMovie.poster_url
          })
        });

        if (response.ok) {
          const data = await response.json();
          setBackgroundImage(data.blurredImage);
        } else {
          console.log('Failed to blur movie poster via API, using fallback');
          setBackgroundImage('');
        }
      } else {
        console.log('No movie poster available, using fallback');
        setBackgroundImage('');
      }
    } catch (error) {
      console.log('Background capture not available, using fallback');
      setBackgroundImage('');
    }
  };

  const handleSocialClick = async (platform: string) => {
    if (movies.length > 0) {
      setCardColor(generateRandomColor());
      setSelectedPlatform(platform);
      setIsModalOpen(true);
      // Initialize reordered movies when opening modal
      const initialOrder = [...movies];
      setReorderedMovies(initialOrder);
      // Capture and blur background with initial order
      await captureAndBlurBackground(initialOrder);
    } else {
      // If no movies, just show a message or do nothing
      alert(`Share on ${platform} - Get some movie recommendations first!`);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (dragRef.current) {
      dragRef.current.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newMovies = [...reorderedMovies];
      const [draggedMovie] = newMovies.splice(draggedIndex, 1);
      newMovies.splice(dropIndex, 0, draggedMovie);
      setReorderedMovies(newMovies);
      
      // Update background with the new #1 movie
      await captureAndBlurBackground(newMovies);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (dragRef.current) {
      dragRef.current.style.opacity = '1';
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (dragRef.current) {
      dragRef.current.style.opacity = '1';
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDescriptionStep(false); // Close description step too
    setIsPostingStep(false); // Close posting step too
  };

  // Capture modal as image
  const captureModalImage = async (): Promise<string | null> => {
    if (!modalRef.current) return null;
    
    try {
      // Hide close button and other UI elements that shouldn't be in the screenshot
      const closeButton = modalRef.current.querySelector('.close-button') as HTMLElement;
      if (closeButton) closeButton.style.display = 'none';
      
      const canvas = await html2canvas(modalRef.current, {
        useCORS: true,
        allowTaint: true,
        height: modalRef.current.offsetHeight,
        width: modalRef.current.offsetWidth,
      });
      
      // Restore close button
      if (closeButton) closeButton.style.display = '';
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing modal image:', error);
      return null;
    }
  };

  const handleSocialMediaPost = async (platform: string) => {
    try {
      // Capture the modal image first
      const modalImage = await captureModalImage();
      
      const postContent = {
        platform,
        description: description || "Check out these amazing movie recommendations!",
        tags,
        mood,
        movies: (reorderedMovies.length > 0 ? reorderedMovies : movies).slice(0, 3).map(m => m.title),
        username,
        image: modalImage // Include the captured image
      };

      // Call our API to handle the social media posting
      const response = await fetch('/api/post-to-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postContent)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully posted to ${platform}!\n${result.message}`);
        setIsPostingStep(false);
        setIsDescriptionStep(false);
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        alert(`Failed to post to ${platform}: ${error.message}`);
      }
    } catch (error) {
      console.error('Error posting to social media:', error);
      alert(`Error posting to ${platform}. Please try again.`);
    }
  };
  return (
    <div className="inline-flex justify-center w-full pt-10 pb-8">
      <ul className="inline-flex list-none justify-center space-x-4">
        <li 
          onClick={() => handleSocialClick('TikTok')}
          className="group relative bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-110"
        >
          <span className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-[#000000] text-white px-2 py-1 rounded text-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 after:content-[''] after:absolute after:top-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#000000]">
            TikTok
          </span>
          <img 
            src="/tiktoklogo.png" 
            alt="TikTok" 
            className="w-5 h-5 transition-all duration-200 group-hover:brightness-0 group-hover:invert"
          />
          <div className="absolute inset-0 bg-[#000000] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
        </li>
        
        <li 
          onClick={() => handleSocialClick('Twitter')}
          className="group relative bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-110"
        >
          <span className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-[#1da1f2] text-white px-2 py-1 rounded text-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 after:content-[''] after:absolute after:top-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#1da1f2]">
            Twitter
          </span>
          <svg className="w-7 h-7 text-gray-800 group-hover:text-white transition-colors duration-200" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M42,12.429c-1.323,0.586-2.746,0.977-4.247,1.162c1.526-0.906,2.7-2.351,3.251-4.058c-1.428,0.837-3.01,1.452-4.693,1.776C34.967,9.884,33.05,9,30.926,9c-4.08,0-7.387,3.278-7.387,7.32c0,0.572,0.067,1.129,0.193,1.67c-6.138-0.308-11.582-3.226-15.224-7.654c-0.64,1.082-1,2.349-1,3.686c0,2.541,1.301,4.778,3.285,6.096c-1.211-0.037-2.351-0.374-3.349-0.914c0,0.022,0,0.055,0,0.086c0,3.551,2.547,6.508,5.923,7.181c-0.617,0.169-1.269,0.263-1.941,0.263c-0.477,0-0.942-0.054-1.392-0.135c0.94,2.902,3.667,5.023,6.898,5.086c-2.528,1.96-5.712,3.134-9.174,3.134c-0.598,0-1.183-0.034-1.761-0.104C9.268,36.786,13.152,38,17.321,38c13.585,0,21.017-11.156,21.017-20.834c0-0.317-0.01-0.633-0.025-0.945C39.763,15.197,41.013,13.905,42,12.429" />
          </svg>
          <div className="absolute inset-0 bg-[#1da1f2] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
        </li>
        
        <li 
          onClick={() => handleSocialClick('Instagram')}
          className="group relative bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-110"
        >
          <span className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-[#e4405f] text-white px-2 py-1 rounded text-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 after:content-[''] after:absolute after:top-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#e4405f]">
            Instagram
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-800 group-hover:text-white transition-colors duration-200" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
          </svg>
          <div className="absolute inset-0 bg-[#e4405f] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
        </li>
      </ul>

      {/* 9:16 Modal for sharing */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75" 
          onClick={closeModal}
        >
          <div className="relative">
            {/* Modal - Centered */}
            <div 
              ref={modalRef}
              className="rounded-2xl shadow-2xl max-w-sm w-full mx-4 aspect-[9/16] flex flex-col overflow-hidden relative"
              style={{
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: backgroundImage ? 'transparent' : 'rgb(17, 24, 39)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={closeModal}
                className="close-button absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
              >
                ×
              </button>

              {/* Header */}
              <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Top 3 Mood Matches</h2>
                <p className="text-gray-300 text-lg italic">"{mood}"</p>
              </div>

              {/* Movies */}
              <div className="flex-1 p-4 space-y-2">
                {(reorderedMovies.length > 0 ? reorderedMovies : movies).slice(0, 3).map((movie, index) => (
                  <div 
                    key={`${movie.title}-${movie.year}-${index}`}
                    ref={index === draggedIndex ? dragRef : null}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-black/50 rounded-lg p-3 flex items-center space-x-3 cursor-move transition-all duration-200 ${
                      draggedIndex === index ? 'opacity-50 scale-95' : ''
                    } ${
                      dragOverIndex === index ? 'border-2 border-dashed border-blue-400 bg-blue-900/20' : ''
                    }`}
                  >
                    {/* Ranking number */}
                    <div className="flex-shrink-0 mr-6">
                      <span className="text-white font-bold text-2xl">{index + 1}</span>
                    </div>
                    
                    {/* Movie poster */}
                    <img 
                      src={movie.poster_url || 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop'} 
                      alt={`${movie.title} poster`}
                      className="w-16 h-24 object-cover rounded-lg"
                    />
                    
                    {/* Movie details */}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm">{movie.title}</h3>
                      <p className="text-gray-400 text-xs">{movie.year}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-white text-xs ml-1">{Number(movie.rating_out_of_10).toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Created by line */}
                <div className="text-center mt-8">
                  <div className={`bg-gradient-to-r ${cardColor} backdrop-blur-sm rounded-xl p-2 shadow-lg border border-white/10 mb-2`}>
                    <p className="text-gray-300 text-lg font-medium">Created by {username} on Yscenes</p>
                  </div>
                </div>
              </div>
              {/* Footer with app branding */}
              <div className="p-2 text-center -mt-12">
                <p className="text-gray-300 text-sm">Who else got something similar?</p>
                <p className="text-white text-xs mt-1">Generate and share yours @Yscenes.com</p>
              </div>
            </div>
            
            {/* Continue Button - Positioned to the right of the modal */}
            <div className="absolute left-full ml-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-[60]">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const url = createLink();
                  console.log('Share now - Generated URL:', url);
                  console.log('Share now - Movies included:', movies.slice(0, 3).map(m => `${m.title} (${m.year})`));
                  setIsDescriptionStep(true);
                }}
                className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg text-base whitespace-nowrap"
              >
                Share now →
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const url = createLink();
                  console.log('Generated share URL:', url);
                  console.log('URL contains movies:', movies.slice(0, 3).map(m => `${m.title} (${m.year})`));
                  const success = await copyLink(url);
                  if (success) {
                    alert('Link copied! Share this to show your Top 3 movie list.');
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg text-base whitespace-nowrap"
              >
                Copy link
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!modalRef.current) return;
                  
                  try {
                    // Hide close button and other UI elements that shouldn't be in the screenshot
                    const closeButton = modalRef.current.querySelector('.close-button') as HTMLElement;
                    if (closeButton) closeButton.style.display = 'none';
                    
                    // Sanitize CSS to remove unsupported color functions
                    const originalStyles = new Map();
                    const elements = modalRef.current.querySelectorAll('*');
                    elements.forEach((el) => {
                      const computedStyle = window.getComputedStyle(el);
                      const properties = ['background-color', 'color', 'border-color', 'box-shadow', 'text-shadow', 'outline-color'];
                      
                      properties.forEach(prop => {
                        const value = computedStyle.getPropertyValue(prop);
                        if (value && value.trim() !== '' && value !== 'none') {
                          // Check for unsupported color functions
                          const hasUnsupportedColor = value.includes('lab(') || 
                                                     value.includes('lch(') || 
                                                     value.includes('oklab(') || 
                                                     value.includes('oklch(') ||
                                                     value.includes('color(') ||
                                                     value.includes('color-mix(');
                          
                          if (hasUnsupportedColor) {
                            // Fallback colors based on property
                            let safeColor = '#000000';
                            if (prop === 'background-color') {
                              safeColor = '#ffffff'; // White background
                            } else if (prop === 'color') {
                              safeColor = '#000000'; // Black text
                            } else if (prop === 'border-color') {
                              safeColor = '#cccccc'; // Light gray border
                            } else if (prop === 'box-shadow' || prop === 'text-shadow') {
                              safeColor = 'none'; // Remove shadows with unsupported colors
                            } else if (prop === 'outline-color') {
                              safeColor = '#000000'; // Black outline
                            }
                            
                            originalStyles.set(el, { element: el, property: prop, value: (el as HTMLElement).style[prop as any] });
                            (el as HTMLElement).style[prop as any] = safeColor;
                          }
                        }
                      });
                    });
                    
                    // Dynamically import html2canvas for client-side rendering
                    const html2canvas = (await import('html2canvas')).default;
                    
                    console.log('Capturing modal element:', modalRef.current);
                    console.log('Modal dimensions:', modalRef.current.offsetWidth, 'x', modalRef.current.offsetHeight);
                    
                    let canvas;
                    try {
                      canvas = await html2canvas(modalRef.current, {
                        useCORS: true,
                        allowTaint: true,
                        height: modalRef.current.offsetHeight,
                        width: modalRef.current.offsetWidth,
                        background: '#000000',
                        logging: false
                      });
                    } catch (colorError) {
                      console.warn('html2canvas failed with color parsing error, retrying with basic settings:', colorError);
                      // Fallback with minimal settings and safer color handling
                      try {
                        canvas = await html2canvas(modalRef.current, {
                          background: '#ffffff',
                          logging: false,
                          useCORS: false,
                          allowTaint: false
                        });
                      } catch (fallbackError) {
                        console.error('html2canvas completely failed:', fallbackError);
                        // Create a simple text-based fallback instead of failing
                        const fallbackCanvas = document.createElement('canvas');
                        fallbackCanvas.width = 800;
                        fallbackCanvas.height = 600;
                        const ctx = fallbackCanvas.getContext('2d');
                        if (ctx) {
                          ctx.fillStyle = '#000000';
                          ctx.fillRect(0, 0, 800, 600);
                          ctx.fillStyle = '#ffffff';
                          ctx.font = '24px Arial';
                          ctx.textAlign = 'center';
                          ctx.fillText('YScenes Movie Recommendations', 400, 300);
                          ctx.font = '16px Arial';
                          ctx.fillText('Check out my movie recommendations!', 400, 350);
                        }
                        canvas = fallbackCanvas;
                      }
                    }
                    
                    // Restore original styles
                    originalStyles.forEach(({ element, property, value }) => {
                      (element as HTMLElement).style[property as any] = value;
                    });
                    
                    // Restore close button
                    if (closeButton) closeButton.style.display = '';
                    
                    // Create download link
                    const dataUrl = canvas.toDataURL('image/png');
                    console.log('Generated image data URL length:', dataUrl.length);
                    
                    const link = document.createElement('a');
                    link.download = 'yscenes-top3-movies.png';
                    link.href = dataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    console.log('Modal image downloaded successfully with movies:', movies.slice(0, 3).map(m => m.title));
                    alert('Your Top 3 movie list downloaded successfully!');
                  } catch (error) {
                    console.error('Error capturing image:', error);
                    alert('Failed to download image. Please try again.');
                  }
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-lg text-base whitespace-nowrap"
              >
                Save as 9:16 image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Description Step Modal */}
      {isDescriptionStep && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75"
        >
          <div className="relative">
            {/* Modal - Centered */}
            <div 
              className="bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-2xl max-w-sm w-full mx-4 aspect-[9/16] flex flex-col overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setIsDescriptionStep(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
              >
                ×
              </button>

              {/* Header */}
              <div className="p-4 text-center border-b border-gray-700">
                <h2 className="text-lg font-bold text-white mb-2">Preview {selectedPlatform} Post</h2>
                <p className="text-gray-300 text-xs">Add your personal touch</p>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {/* Miniature Preview Card */}
                <div className="flex justify-center">
                  <div className="w-24 h-42 bg-gradient-to-b from-gray-900 to-black rounded-lg shadow-lg border border-gray-600 relative overflow-hidden">
                    {/* Grey blur overlay */}
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-80 backdrop-blur-sm flex items-center justify-center">
                      <button 
                        onClick={() => setIsDescriptionStep(false)}
                        className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 text-sm"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white text-xs font-medium mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Everyone needs to watch these..."
                    className="w-full h-16 bg-gray-800 border border-gray-600 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none text-xs"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-white text-xs font-medium mb-1">Tags</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="#movies #recommendations #mood"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                {/* Preview */}
                <div className="bg-black/30 rounded-lg p-2">                  <div className="text-gray-300 text-xs space-y-1">
                    <p><strong>Platform:</strong> {selectedPlatform}</p>
                    <p><strong>Mood:</strong> "{mood}"</p>
                    <p><strong>Movies:</strong> {(reorderedMovies.length > 0 ? reorderedMovies : movies).slice(0, 3).map(m => m.title).join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 border-t border-gray-700">
                <button 
                  onClick={() => setIsDescriptionStep(false)}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 text-xs"
                >
                  Back
                </button>
              </div>
            </div>
            
            {/* Continue Button - Positioned to the right of the modal */}
            <button 
              onClick={() => setIsPostingStep(true)}
              className="absolute left-full ml-6 top-1/2 transform -translate-y-1/2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg text-base whitespace-nowrap z-10"
            >
              Connect & Post →
            </button>
          </div>
        </div>
      )}

      {/* Posting Step Modal */}
      {isPostingStep && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative">
            <div 
              className="bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-2xl max-w-sm w-full mx-4 aspect-[9/16] flex flex-col overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close button */}
            <button 
              onClick={() => setIsPostingStep(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
            >
              ×
            </button>

            {/* Header */}
            <div className="p-4 text-center border-b border-gray-700">
              <h2 className="text-xl font-bold text-white mb-2">Connect to {selectedPlatform}</h2>
              <p className="text-gray-300 text-sm">Link your account and post</p>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Platform-specific connection */}
              <div className="text-center">
                <div className="bg-gray-800 rounded-lg p-6 mb-4">
                  <h3 className="text-white text-lg font-medium mb-2">Connect your {selectedPlatform} account</h3>
                  <p className="text-gray-300 text-sm mb-4">We'll need permission to post on your behalf</p>
                  <button 
                    onClick={() => handleSocialMediaPost(selectedPlatform)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    Connect & Post to {selectedPlatform}
                  </button>
                </div>
              </div>

              {/* Post Preview */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-white text-sm font-medium mb-3">Your Post Preview</h4>
                <div className="text-gray-300 text-sm space-y-2">
                  <p className="bg-gray-800 p-3 rounded border-l-4 border-blue-500">
                    {description || "Check out these amazing movie recommendations!"}
                  </p>
                  <p className="text-blue-400">{tags}</p>
                  <p className="text-gray-400 text-xs">
                    Mood: "{mood}" | Movies: {(reorderedMovies.length > 0 ? reorderedMovies : movies).slice(0, 3).map(m => m.title).join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-700">
              <button 
                onClick={() => setIsPostingStep(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 text-sm"
              >
                Back
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialsButton;