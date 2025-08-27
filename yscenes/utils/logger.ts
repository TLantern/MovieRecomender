import fs from 'fs';
import path from 'path';

interface MovieRecommendation {
  title: string;
  year: number;
  description: string;
  rating_out_of_10?: number;
  stars?: string;
  stream_link?: string;
  poster_url?: string;
}

interface RecommendationLog {
  timestamp: string;
  sessionId?: string;
  mood: string;
  yearRange: [number, number];
  movies: MovieRecommendation[];
  source: 'backend' | 'fallback';
  backendAvailable: boolean;
}

export class RecommendationLogger {
  private resultsDir: string;
  private isServerless: boolean;
  private currentLogFile: string;
  private currentSessionId: string;

  constructor() {
    // Check if we're in a serverless environment
    this.isServerless = Boolean(process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production');
    
    if (this.isServerless) {
      // In serverless, disable file logging completely
      this.resultsDir = '';
      this.currentLogFile = '';
      this.currentSessionId = '';
      console.log('Logger: Serverless environment detected, file logging disabled');
    } else {
      // Use process.cwd() but ensure we're in the right directory
      this.resultsDir = path.join(process.cwd(), 'results');
      this.ensureResultsDir();
      // Don't create a log file immediately - wait for first recommendation
      this.currentLogFile = '';
      this.currentSessionId = '';
      console.log(`Logger: Initialized, will create log file on first recommendation`);
    }
  }

  private ensureResultsDir(): void {
    if (this.isServerless) return;
    
    console.log('Logger: Current working directory:', process.cwd());
    console.log('Logger: Results directory:', this.resultsDir);
    
    try {
      if (!fs.existsSync(this.resultsDir)) {
        console.log('Logger: Creating results directory...');
        fs.mkdirSync(this.resultsDir, { recursive: true });
        console.log('Logger: Results directory created successfully');
      } else {
        console.log('Logger: Results directory already exists');
      }
    } catch (error) {
      console.warn('Logger: Could not create results directory:', error);
      this.resultsDir = '';
    }
  }

  private generateNewLogFile(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `recommendation-session-${timestamp}.json`;
  }

  async logRecommendation(
    mood: string,
    yearRange: [number, number],
    movies: MovieRecommendation[],
    sessionId?: string,
    backendAvailable: boolean = true,
    source: 'backend' | 'fallback' = 'backend'
  ): Promise<void> {
    try {
      const logEntry: RecommendationLog = {
        timestamp: new Date().toISOString(),
        sessionId,
        mood,
        yearRange,
        movies,
        source,
        backendAvailable
      };

      // If no results directory (serverless), just log to console
      if (!this.resultsDir) {
        console.log('Recommendation (console only):', JSON.stringify(logEntry, null, 2));
        return;
      }

      // Check if we need a new log file (new session or no current file)
      if (!this.currentLogFile || (sessionId && sessionId !== this.currentSessionId)) {
        this.currentLogFile = this.generateNewLogFile();
        this.currentSessionId = sessionId || '';
        console.log(`Logger: Created new log file for session ${sessionId}: ${this.currentLogFile}`);
      }

      const filepath = path.join(this.resultsDir, this.currentLogFile);
      
      let existingEntries: RecommendationLog[] = [];
      
      // Read existing entries if file exists
      if (fs.existsSync(filepath)) {
        try {
          const existingContent = fs.readFileSync(filepath, 'utf8');
          existingEntries = JSON.parse(existingContent);
          console.log(`Logger: Found ${existingEntries.length} existing entries in session file`);
        } catch (parseError) {
          console.warn('Logger: Could not parse existing file, starting fresh:', parseError);
          existingEntries = [];
        }
      }
      
      // Append new entry to existing entries
      existingEntries.push(logEntry);
      
      // Write all entries back to file
      fs.writeFileSync(
        filepath,
        JSON.stringify(existingEntries, null, 2),
        'utf8'
      );

      console.log(`Recommendation logged to: ${filepath} (${existingEntries.length} total entries)`);
    } catch (error) {
      console.error('Error logging recommendation:', error);
      // Don't throw - logging should not break the main functionality
    }
  }

  // Get all previously recommended movie titles from ALL log files to prevent duplicates
  async getAllPreviouslyRecommendedTitles(): Promise<string[]> {
    try {
      // If no results directory (serverless), return empty array
      if (!this.resultsDir) {
        return [];
      }

      const files = fs.readdirSync(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const allTitles: string[] = [];

      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const logEntries: RecommendationLog[] = JSON.parse(content);
          
          logEntries.forEach(logEntry => {
            logEntry.movies.forEach(movie => {
              const titleKey = `${movie.title} (${movie.year})`;
              if (!allTitles.includes(titleKey)) {
                allTitles.push(titleKey);
              }
            });
          });
        } catch (error) {
          console.warn(`Could not parse log file ${file}:`, error);
        }
      }

      return allTitles.sort();
    } catch (error) {
      console.error('Error getting previously recommended titles:', error);
      return [];
    }
  }

  // Get all previously recommended movies with full details from ALL log files
  async getAllPreviouslyRecommendedMovies(): Promise<MovieRecommendation[]> {
    try {
      // If no results directory (serverless), return empty array
      if (!this.resultsDir) {
        return [];
      }

      const files = fs.readdirSync(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const allMovies: MovieRecommendation[] = [];

      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const logEntries: RecommendationLog[] = JSON.parse(content);
          
          logEntries.forEach(logEntry => {
            logEntry.movies.forEach(movie => {
              // Check if we already have this movie (title + year combination)
              const existingIndex = allMovies.findIndex(
                existing => existing.title === movie.title && existing.year === movie.year
              );
              
              if (existingIndex === -1) {
                allMovies.push(movie);
              }
            });
          });
        } catch (error) {
          console.warn(`Could not parse log file ${file}:`, error);
        }
      }

      return allMovies;
    } catch (error) {
      console.error('Error getting previously recommended movies:', error);
      return [];
    }
  }

  // Get recent logs from ALL log files
  async getRecentLogs(limit: number = 10): Promise<RecommendationLog[]> {
    try {
      // If no results directory (serverless), return empty array
      if (!this.resultsDir) {
        return [];
      }

      const files = fs.readdirSync(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const allLogs: RecommendationLog[] = [];

      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const logEntries: RecommendationLog[] = JSON.parse(content);
          allLogs.push(...logEntries);
        } catch (error) {
          console.warn(`Could not parse log file ${file}:`, error);
        }
      }

      // Sort by timestamp and return the most recent
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return allLogs.slice(0, limit);
    } catch (error) {
      console.error('Error reading recent logs:', error);
      return [];
    }
  }

  async getStats(): Promise<{
    totalRecommendations: number;
    totalMovies: number;
    moods: Record<string, number>;
    backendUsage: { backend: number; fallback: number };
    duplicateDetection: {
      totalUniqueTitles: number;
      totalDuplicateTitles: number;
      duplicateTitles: string[];
    };
    sessionFiles: number;
  }> {
    try {
      // If no results directory (serverless), return empty stats
      if (!this.resultsDir) {
        return {
          totalRecommendations: 0,
          totalMovies: 0,
          moods: {},
          backendUsage: { backend: 0, fallback: 0 },
          duplicateDetection: {
            totalUniqueTitles: 0,
            totalDuplicateTitles: 0,
            duplicateTitles: []
          },
          sessionFiles: 0
        };
      }

      const files = fs.readdirSync(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      let totalRecommendations = 0;
      let totalMovies = 0;
      const moods: Record<string, number> = {};
      const backendUsage = { backend: 0, fallback: 0 };
      const allTitles: string[] = [];
      const titleCounts: Record<string, number> = {};

      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const logEntries: RecommendationLog[] = JSON.parse(content);
          
          logEntries.forEach(logEntry => {
            totalRecommendations++;
            totalMovies += logEntry.movies.length;
            
            moods[logEntry.mood] = (moods[logEntry.mood] || 0) + 1;
            backendUsage[logEntry.source]++;
            
            // Collect all titles for duplicate detection
            logEntry.movies.forEach(movie => {
              const titleKey = `${movie.title} (${movie.year})`;
              allTitles.push(titleKey);
              titleCounts[titleKey] = (titleCounts[titleKey] || 0) + 1;
            });
          });
        } catch (error) {
          console.warn(`Could not parse log file ${file}:`, error);
        }
      }

      // Calculate duplicate detection stats
      const uniqueTitles = Object.keys(titleCounts);
      const duplicateTitles = uniqueTitles.filter(title => titleCounts[title] > 1);
      const totalDuplicateTitles = duplicateTitles.reduce((sum, title) => sum + titleCounts[title] - 1, 0);

      return {
        totalRecommendations,
        totalMovies,
        moods,
        backendUsage,
        duplicateDetection: {
          totalUniqueTitles: uniqueTitles.length,
          totalDuplicateTitles,
          duplicateTitles
        },
        sessionFiles: jsonFiles.length
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalRecommendations: 0,
        totalMovies: 0,
        moods: {},
        backendUsage: { backend: 0, fallback: 0 },
        duplicateDetection: {
          totalUniqueTitles: 0,
          totalDuplicateTitles: 0,
          duplicateTitles: []
        },
        sessionFiles: 0
      }
    }
  }

  async getDuplicateTitles(): Promise<{
    duplicateTitles: string[];
    titleCounts: Record<string, number>;
    recommendationsWithDuplicates: Array<{
      timestamp: string;
      sessionId?: string;
      mood: string;
      duplicateTitles: string[];
    }>;
  }> {
    try {
      // If no results directory (serverless), return empty result
      if (!this.resultsDir) {
        return {
          duplicateTitles: [],
          titleCounts: {},
          recommendationsWithDuplicates: []
        };
      }
      const files = fs.readdirSync(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const titleCounts: Record<string, number> = {};
      const recommendationsWithDuplicates: Array<{
        timestamp: string;
        sessionId?: string;
        mood: string;
        duplicateTitles: string[];
      }> = [];

      // First pass: count all titles from all files
      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const logEntries: RecommendationLog[] = JSON.parse(content);
          
          logEntries.forEach(logEntry => {
            logEntry.movies.forEach(movie => {
              const titleKey = `${movie.title} (${movie.year})`;
              titleCounts[titleKey] = (titleCounts[titleKey] || 0) + 1;
            });
          });
        } catch (error) {
          console.warn(`Could not parse log file ${file}:`, error);
        }
      }

      // Second pass: find recommendations with duplicates
      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const logEntries: RecommendationLog[] = JSON.parse(content);
          
          logEntries.forEach(logEntry => {
            const duplicateTitlesInRecommendation = logEntry.movies
              .map(movie => `${movie.title} (${movie.year})`)
              .filter(titleKey => titleCounts[titleKey] > 1);

            if (duplicateTitlesInRecommendation.length > 0) {
              recommendationsWithDuplicates.push({
                timestamp: logEntry.timestamp,
                sessionId: logEntry.sessionId,
                mood: logEntry.mood,
                duplicateTitles: duplicateTitlesInRecommendation
              });
            }
          });
        } catch (error) {
          console.warn(`Could not parse log file ${file}:`, error);
        }
      }

      const duplicateTitles = Object.keys(titleCounts).filter(title => titleCounts[title] > 1);

      return {
        duplicateTitles,
        titleCounts,
        recommendationsWithDuplicates
      };
    } catch (error) {
      console.error('Error getting duplicate titles:', error);
      return {
        duplicateTitles: [],
        titleCounts: {},
        recommendationsWithDuplicates: []
      };
    }
  }

  // Get list of all session files
  async getSessionFiles(): Promise<Array<{
    filename: string;
    timestamp: string;
    recommendationCount: number;
    movieCount: number;
  }>> {
    try {
      if (!this.resultsDir) {
        return [];
      }

      const files = fs.readdirSync(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const sessionInfo = [];

      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const logEntries: RecommendationLog[] = JSON.parse(content);
          
          sessionInfo.push({
            filename: file,
            timestamp: logEntries[0]?.timestamp || 'Unknown',
            recommendationCount: logEntries.length,
            movieCount: logEntries.reduce((sum, entry) => sum + entry.movies.length, 0)
          });
        } catch (error) {
          console.warn(`Could not parse log file ${file}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      sessionInfo.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return sessionInfo;
    } catch (error) {
      console.error('Error getting session files:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const recommendationLogger = new RecommendationLogger(); 