import { useEffect } from 'react';

interface ShareModalData {
  mood: string;
  username: string;
  cardColor: string;
  top3Movies: Array<{
    title: string;
    year: number;
    description: string;
    rating_out_of_10: number;
    poster_url?: string;
  }>;
}

export const useShareModal = (
  movies: any[],
  mood: string,
  username: string,
  cardColor: string,
  isModalOpen: boolean,
  setIsModalOpen: (open: boolean) => void,
  setReorderedMovies: (movies: any[]) => void
) => {
  const createLink = (): string => {
    const payload: ShareModalData = {
      mood,
      username,
      cardColor,
      top3Movies: movies.slice(0, 3)
    };
    
    const encodedData = btoa(JSON.stringify(payload));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?modal=top3&data=${encodedData}`;
  };

  const copyLink = async (url: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      // Fallback: prompt user to copy manually
      const copied = window.prompt('Copy this link:', url);
      return !!copied;
    }
  };

  const openFromURLOnMount = () => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const modalType = urlParams.get('modal');
    const encodedData = urlParams.get('data');

    if (modalType === 'top3' && encodedData) {
      try {
        const decodedData: ShareModalData = JSON.parse(atob(encodedData));
        
        // Set the modal data
        setReorderedMovies(decodedData.top3Movies);
        setIsModalOpen(true);
        
        // Clean up URL without page reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
      } catch (error) {
        console.error('Failed to decode modal data:', error);
      }
    }
  };

  // Auto-open modal from URL on mount
  useEffect(() => {
    if (!isModalOpen) {
      openFromURLOnMount();
    }
  }, []);

  return {
    createLink,
    copyLink,
    openFromURLOnMount
  };
};
