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

  constructor() {
    // Check if we're in a serverless environment
    this.isServerless = Boolean(process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production');
    
    if (this.isServerless) {
      // In serverless, disable file logging completely
      this.resultsDir = '';
      console.log('Logger: Serverless environment detected, file logging disabled');
    } else {
      // Use process.cwd() but ensure we're in the right directory
      this.resultsDir = path.join(process.cwd(), 'results');
      this.ensureResultsDir();
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

  private generateFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `recommendation-${timestamp}.json`;
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

      const filename = this.generateFilename();
      const filepath = path.join(this.resultsDir, filename);

      // Write the log entry to a JSON file using synchronous operation for better compatibility
      fs.writeFileSync(
        filepath,
        JSON.stringify(logEntry, null, 2),
        'utf8'
      );

      console.log(`Recommendation logged to: ${filepath}`);
    } catch (error) {
      console.error('Error logging recommendation:', error);
      // Don't throw - logging should not break the main functionality
    }
  }

  async getRecentLogs(limit: number = 10): Promise<RecommendationLog[]> {
    try {
      // If no results directory (serverless), return empty array
      if (!this.resultsDir) {
        return [];
      }

      const files = fs.readdirSync(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      // Sort files by creation time (newest first)
      const sortedFiles = jsonFiles.sort((a, b) => {
        const statA = fs.statSync(path.join(this.resultsDir, a));
        const statB = fs.statSync(path.join(this.resultsDir, b));
        return statB.birthtime.getTime() - statA.birthtime.getTime();
      });

      const recentLogs: RecommendationLog[] = [];
      
      for (let i = 0; i < Math.min(limit, sortedFiles.length); i++) {
        const filepath = path.join(this.resultsDir, sortedFiles[i]);
        const content = fs.readFileSync(filepath, 'utf8');
        const logEntry = JSON.parse(content) as RecommendationLog;
        recentLogs.push(logEntry);
      }

      return recentLogs;
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
  }> {
    try {
      // If no results directory (serverless), return empty stats
      if (!this.resultsDir) {
        return {
          totalRecommendations: 0,
          totalMovies: 0,
          moods: {},
          backendUsage: { backend: 0, fallback: 0 }
        };
      }

      const files = fs.readdirSync(this.resultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      let totalRecommendations = 0;
      let totalMovies = 0;
      const moods: Record<string, number> = {};
      const backendUsage = { backend: 0, fallback: 0 };

      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        const logEntry = JSON.parse(content) as RecommendationLog;
        
        totalRecommendations++;
        totalMovies += logEntry.movies.length;
        
        moods[logEntry.mood] = (moods[logEntry.mood] || 0) + 1;
        backendUsage[logEntry.source]++;
      }

      return {
        totalRecommendations,
        totalMovies,
        moods,
        backendUsage
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalRecommendations: 0,
        totalMovies: 0,
        moods: {},
        backendUsage: { backend: 0, fallback: 0 }
      }
    }
  }
}

// Export a singleton instance
export const recommendationLogger = new RecommendationLogger(); 