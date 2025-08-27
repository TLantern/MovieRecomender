# Movie Recommendation Duplicate Detection System

This system automatically logs all movie recommendations and provides tools to detect and analyze duplicate movie titles to ensure variety in recommendations.

## Features

### 🔍 Automatic Session-Based Logging
- **New session file on each page refresh**: Every time a user refreshes the page, a completely new log file is created
- **Session isolation**: Each session is completely separate with no shared movie history
- **Session-based duplicate prevention**: Previously recommended titles within the current session are automatically excluded
- **Logs are stored in JSON format** in the `results/` directory with timestamped filenames
- **Works in both development and production environments**

### 📊 Duplicate Detection
- **Cross-session tracking**: All movie titles are tracked across ALL session files
- **Duplicate identification**: Automatically detects when the same movie title appears across different sessions
- **Session tracking**: Links duplicates to specific user sessions for debugging
- **Comprehensive stats**: Provides overview of total recommendations, unique titles, and duplicates across all sessions

### 🛠️ Admin Interface
- **Web-based admin panel** at `/admin` route
- **Six main tabs**:
  - **Overview**: High-level statistics including session file count
  - **Recent Logs**: Latest recommendation logs from all sessions
  - **Duplicates**: Detailed duplicate analysis across all sessions
  - **All Titles**: Complete list of all unique movie titles ever recommended
  - **Exclusions**: Titles automatically excluded to prevent duplicates
  - **Sessions**: Individual session log files and their information

## How Sessions Work

### Session Creation
1. **Page Refresh**: Each time a user refreshes the page, a new session begins
2. **New Log File**: A new timestamped log file is created (e.g., `recommendation-session-2024-01-15T10-30-45-123Z.json`)
3. **Fresh Start**: The new session starts with no movie memory from previous sessions
4. **Session-based Exclusion**: The system automatically excludes movies recommended within the current session only

### Session Boundaries
- **Start**: Page refresh or new browser tab
- **End**: Page refresh, browser tab close, or 30-minute timeout
- **Isolation**: Each session is completely independent
- **Memory**: No shared state between sessions

## API Endpoints

### `/api/logs?action=stats`
Returns comprehensive statistics including:
- Total recommendations and movies across all sessions
- Mood distribution
- Backend vs fallback usage
- Duplicate detection summary
- **Total session files count**

### `/api/logs?action=recent&limit=10`
Returns recent recommendation logs from all sessions (default: 10, max: 50)

### `/api/logs?action=duplicates`
Returns detailed duplicate analysis across all sessions:
- List of all duplicate titles
- Count of how many times each title appears
- Recommendations that contain duplicates

### `/api/logs?action=unique-titles`
Returns all unique movie titles ever recommended across all sessions

### `/api/logs?action=exclude-titles`
Returns all titles that are automatically excluded from future recommendations

### `/api/logs?action=session-files`
Returns information about all individual session log files:
- Filename and timestamp
- Number of recommendations per session
- Number of movies per session

## Usage Examples

### Check for Duplicates via API
```bash
# Get overall stats including session count
curl "http://localhost:3000/api/logs?action=stats"

# Get detailed duplicate information across all sessions
curl "http://localhost:3000/api/logs?action=duplicates"

# Get all unique titles from all sessions
curl "http://localhost:3000/api/logs?action=unique-titles"

# Get session file information
curl "http://localhost:3000/api/logs?action=session-files"
```

### Test Script
Run the included test script to see all features in action:
```bash
node test-duplicates.js
```

### Web Interface
Navigate to `/admin` in your browser to access the full admin interface.

## How It Works

1. **Session-Based Logging**: 
   - Each page refresh creates a new log file
   - Each file contains only the recommendations from that specific session
   - Files are named with timestamps for easy identification

2. **Session-based Duplicate Prevention**: 
   - When making recommendations, the system tracks movies recommended in the current session
   - Creates an exclusion list of titles recommended within the current session only
   - Automatically excludes these titles from subsequent recommendations in the same session
   - Ensures no movie is recommended twice within a single session

3. **Real-time Analysis**: All data is available immediately through:
   - API endpoints for programmatic access
   - Web interface for human analysis
   - Comprehensive statistics and reporting across all sessions

## Benefits

- **Complete Session Isolation**: Each page refresh starts completely fresh
- **Session-based Duplicate Prevention**: No movie can be recommended twice within the same session
- **Quality Assurance**: Ensure variety in movie recommendations across all users
- **User Experience**: Maintain freshness and variety in suggestions
- **Debugging**: Track down issues with specific sessions and moods
- **Analytics**: Understand recommendation patterns across all user sessions
- **Compliance**: Maintain logs for audit and quality control purposes

## File Structure

```
yscenes/
├── utils/
│   └── logger.ts          # Core logging and duplicate detection logic
├── app/
│   ├── api/
│   │   └── logs/
│   │       └── route.ts   # API endpoints for accessing logs
│   └── admin/
│       └── page.tsx       # Web-based admin interface
├── results/                # Individual session JSON log files
│   ├── recommendation-session-2024-01-15T10-30-45-123Z.json
│   ├── recommendation-session-2024-01-15T11-15-22-456Z.json
│   └── ...                # New file for each page refresh
└── test-duplicates.js     # Test script for the system
```

## Monitoring and Alerts

The system provides visual alerts in the admin interface:
- 🚨 Red indicators for duplicate titles across sessions
- 📊 Real-time statistics including session file count
- 📝 Detailed logs with timestamps from all sessions
- 🔍 Easy filtering and search capabilities
- 📁 Session file management and overview

## Best Practices

1. **Regular Monitoring**: Check the admin panel regularly for duplicate patterns across sessions
2. **Session Analysis**: Use session files to track user-specific recommendation patterns
3. **Mood Analysis**: Monitor which moods tend to produce duplicates across sessions
4. **Backend Health**: Track backend vs fallback usage to identify system issues
5. **Data Retention**: Logs are stored indefinitely for historical analysis
6. **Session Cleanup**: Consider archiving old session files if storage becomes an issue

## Troubleshooting

### No Logs Appearing
- Check if the `results/` directory exists and is writable
- Verify the recommendation API is being called
- Check console for any logging errors
- Ensure page refreshes are creating new session files

### Duplicates Not Detected
- Ensure movie titles include year information
- Check that the logging system is properly integrated
- Verify API endpoints are accessible
- Check that session files are being created on page refresh

### Performance Issues
- Large numbers of session files may slow down the admin interface
- Consider implementing pagination for very large datasets
- Monitor file system space for log storage
- Consider archiving old session files

### Session Management
- Each page refresh should create a new log file
- Check the Sessions tab to see all individual session files
- Verify that new sessions start with no previous movie memory
- Ensure automatic exclusion is working across all sessions 