# BrowserVision MCP — Claude Code Project Memory

## Core Details
- **Project**: BrowserVision MCP (Autonomous Browser Vision & Computer Use)
- **Author / Maintainer**: `screen-watcher-elite`
- **Target Repository**: `https://github.com/screen-watcher-elite/browser-vision-MCP`
- **Primary Use Cases**: Automated web application testing, visual QA, screenshot capture, DOM inspection, and console error detection.

## Key Capabilities
1. `browser_open`: Navigate to URLs (http://, https://, file:///) with configurable wait conditions.
2. `browser_screenshot`: Capture full-page or viewport base64 screenshots directly for visual models.
3. `browser_click`: Click elements by CSS selector or (x, y) coordinates with automatic hover states.
4. `browser_type`: Input text or trigger keypress events with options to clear fields.
5. `browser_evaluate`: Run arbitrary JavaScript in the page context.
6. `browser_get_dom`: Extract semantic DOM trees or interactive elements map with bounding boxes.
7. `browser_console_logs`: Retrieve real-time browser console errors and uncaught exceptions.
8. `browser_scroll`: Smooth scroll viewports up/down.
9. `browser_close`: Cleanly terminate browser sessions and free resources.
