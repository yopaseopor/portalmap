# Taginfo API CSV Downloader

A Python tool to download all pages from the Taginfo OpenStreetMap API and combines them into a single CSV file.

## Features

- **GUI Interface**: User-friendly graphical interface with progress tracking
- **Command Line Interface**: Scriptable version for automation
- **Smart Page Detection**: Automatically downloads pages until no more data is available
- **Progress Tracking**: Real-time progress updates and time estimates
- **Error Handling**: Robust timeout and error handling
- **Configurable Settings**: Adjustable timeouts and pause intervals
- **CSV Combining**: Automatically combines all pages into one file

## GUI Version (`taginfo_downloader.py`)

### Requirements
```bash
pip install requests
```

### Usage

```python
python taginfo_downloader.py
```

### Features
- **File Selection**: Browse and select output CSV file location
- **Timeout Configuration**: Set request timeout (10-120 seconds)
- **Pause Settings**: Configure pause between requests (0.5-5.0 seconds)
- **Progress Tracking**: Visual progress bar and status updates
- **Time Estimates**: Shows remaining time estimates
- **Error Handling**: Comprehensive error reporting and recovery

## Command Line Version (`taginfo_downloader_cli.py`)

### Usage

```bash
python taginfo_downloader_cli.py output.csv [options]
```

### Options

- `-t, --timeout`: Request timeout in seconds (default: 30)
- `-p, --pause`: Pause between requests in seconds (default: 1.0)
- `-v, --verbose`: Enable verbose output
- `-m, --max-pages`: Maximum number of pages to download (default: unlimited)

### Examples

```bash
# Basic download (downloads all available pages)
python taginfo_downloader_cli.py taginfo_data.csv

# With custom timeout and pause
python taginfo_downloader_cli.py taginfo_data.csv -t 60 -p 2.0

# Verbose output with max pages limit
python taginfo_downloader_cli.py taginfo_data.csv -v -m 50

# Quick test with just 2 pages
python taginfo_downloader_cli.py test.csv -v -m 2
```

## How It Works

The script uses an improved algorithm that:
1. Downloads pages sequentially starting from page 1
2. Continues until the API returns no data (empty response)
3. Stops when it receives HTTP 404, 400, or empty responses
4. Combines all downloaded data into a single CSV file

This approach ensures all available data is downloaded without needing to estimate the total number of pages upfront.

## API Details

The script downloads data from:
```
https://taginfo.openstreetmap.org/api/4/tags/popular
```

Parameters used:
- `sortname=count_all`
- `sortorder=desc`
- `rp=42` (results per page)
- `format=csv`

## Output Format

The CSV file contains columns:
- `key`: OSM tag key
- `count_all`: Total count of the tag
- `count_nodes`: Count on nodes
- `count_ways`: Count on ways
- `count_relations`: Count on relations
- `values`: Number of different values
- `users`: Number of different users
- `in_wiki`: Whether documented in OSM Wiki
- `project`: Related project

## Error Handling

- **Network Timeouts**: Configurable timeout with retry logic
- **HTTP Errors**: Proper error reporting for failed requests
- **Empty Responses**: Automatically detects when no more data is available
- **Interruption**: Graceful handling of Ctrl+C

## Performance Considerations

- **Pause Between Requests**: Prevents overwhelming the API server
- **Timeout Settings**: Adjustable based on network conditions
- **Memory Usage**: Streams data processing to handle large downloads
- **Progress Updates**: Real-time feedback for long downloads

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout value (`-t` flag)
2. **Rate Limiting**: Increase pause between requests (`-p` flag)
3. **Permission Errors**: Check output file location permissions
4. **Network Issues**: Verify internet connection and API availability

### Debug Information

Use verbose mode (`-v`) to see:
- Request URLs and timing
- Response status codes
- Data processing details
- Error details

## Recent Updates

### Version 2.0 - Improved Logic
- **Fixed page detection**: Now downloads all pages until API returns no data
- **Better error handling**: Handles 404/400 responses as end-of-data indicators
- **Improved progress tracking**: More accurate time estimates
- **Max pages option**: Added `-m/--max-pages` for testing and limiting downloads

## License

This tool is provided as-is for downloading Taginfo API data. Respect the Taginfo API terms of service and avoid excessive requests that could impact server performance.
