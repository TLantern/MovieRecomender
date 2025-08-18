'use client';

import Carousel from '../components/carousel';
import Navbar from '../components/navbar';
import { useMovies } from '../hooks/useMovies';

export default function Home() {
  const { movies, loading, error } = useMovies();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="pt-16">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8 pt-8">
            Welcome to YScenes
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Discover amazing movies and get personalized recommendations based on your taste.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">Error loading movies: {error}</p>
            <p className="text-gray-600 dark:text-gray-300">Please check your TMDb API key configuration.</p>
          </div>
        ) : (
          <Carousel movies={movies} title="Trending Movies" />
        )}
        
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Discover Movies</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse through our extensive collection of movies from all genres and eras.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Smart Recommendations</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get personalized movie suggestions based on your viewing history and preferences.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Rate & Review</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Share your thoughts on movies and help others discover great content.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
