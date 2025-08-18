import Carousel from '../../components/carousel';

// Sample movie data for demonstration
const sampleMovies = [
  {
    id: '1',
    title: 'Inception',
    image: 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop',
    rating: 8.8,
    year: 2010,
    genre: 'Sci-Fi, Thriller'
  },
  {
    id: '2',
    title: 'The Dark Knight',
    image: 'https://images.unsplash.com/photo-1531259683001-31fb7555156c?w=400&h=600&fit=crop',
    rating: 9.0,
    year: 2008,
    genre: 'Action, Crime'
  },
  {
    id: '3',
    title: 'Interstellar',
    image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=600&fit=crop',
    rating: 8.6,
    year: 2014,
    genre: 'Adventure, Drama'
  },
  {
    id: '4',
    title: 'Pulp Fiction',
    image: 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop',
    rating: 8.9,
    year: 1994,
    genre: 'Crime, Drama'
  },
  {
    id: '5',
    title: 'The Shawshank Redemption',
    image: 'https://images.unsplash.com/photo-1531259683001-31fb7555156c?w=400&h=600&fit=crop',
    rating: 9.3,
    year: 1994,
    genre: 'Drama'
  }
];

export default function CarouselDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Movie Carousel Demo
        </h1>
        
        <Carousel 
          movies={sampleMovies} 
          title="Featured Movies"
        />
        
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Carousel Features
          </h2>
          <ul className="text-gray-600 space-y-2">
            <li>• 9:16 aspect ratio movie cards</li>
            <li>• Auto-play with 3-second intervals</li>
            <li>• Pause on hover</li>
            <li>• Navigation arrows and dots</li>
            <li>• Smooth transitions</li>
            <li>• Responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 