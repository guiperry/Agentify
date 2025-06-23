# Agentic Engine Releases

This directory contains the Agentic Engine release files that can be downloaded by users.

## File Organization

Place your Agentic Engine release files in this directory following these naming conventions:

### Windows Releases
- `agentic-engine-v1.0.0-windows.exe`
- `agentic-engine-v1.0.1-windows.exe`
- `agentic-engine-latest-windows.exe`

### macOS Releases
- `agentic-engine-v1.0.0-mac.dmg`
- `agentic-engine-v1.0.0-mac.pkg`
- `agentic-engine-latest-mac.dmg`

### Linux Releases
- `agentic-engine-v1.0.0-linux.AppImage`
- `agentic-engine-v1.0.0-linux.tar.gz`
- `agentic-engine-v1.0.0-linux.deb`
- `agentic-engine-latest-linux.AppImage`

## Download API

The download API automatically serves the latest version for each platform:

- **Windows**: `GET /api/download/engine/windows`
- **macOS**: `GET /api/download/engine/mac`
- **Linux**: `GET /api/download/engine/linux`

## File Detection

The API uses regex patterns to detect platform-specific files:

- **Windows**: Files matching `^agentic-engine.*\.exe$`
- **macOS**: Files matching `^agentic-engine.*\.(dmg|pkg)$`
- **Linux**: Files matching `^agentic-engine.*\.(AppImage|tar\.gz|deb)$`

## Version Selection

When multiple files exist for a platform, the API:
1. Filters files by platform pattern
2. Sorts alphabetically (reverse order)
3. Serves the first file (latest by filename)

## Content Types

The API serves files with appropriate MIME types:
- **Windows (.exe)**: `application/x-msdownload`
- **macOS (.dmg)**: `application/x-apple-diskimage`
- **Linux (.AppImage, etc.)**: `application/x-executable`

## Adding New Releases

1. **Upload your release files** to this directory
2. **Follow the naming convention** above
3. **Test the download** using the API endpoints
4. **Verify file integrity** after download

## Example Files

To test the system, you can add placeholder files:

```bash
# Create test files (replace with actual releases)
touch agentic-engine-v1.0.0-windows.exe
touch agentic-engine-v1.0.0-mac.dmg
touch agentic-engine-v1.0.0-linux.AppImage
```

## Security

- Files are served with `Content-Disposition: attachment` to force download
- Directory traversal protection is implemented
- Only files matching the expected patterns are served
- File existence is verified before serving

## Monitoring

Check available releases:
```bash
curl -X OPTIONS http://localhost:3000/api/download/engine/windows
```

This returns a JSON response with all available releases by platform.

## Troubleshooting

### File Not Found
- Verify the file exists in this directory
- Check the filename matches the expected pattern
- Ensure file permissions allow reading

### Wrong Content Type
- Verify the file extension is correct
- Check the platform-specific patterns above

### Download Issues
- Test with curl: `curl -O http://localhost:3000/api/download/engine/windows`
- Check browser developer tools for errors
- Verify file size and integrity after download
