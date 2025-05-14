
#!/bin/bash

# If you need to test the syslog ingestion, you can use this script
# Make the script executable
chmod +x tools/send_test_logs.js

# Run with default settings
echo "Sending test logs to the ingest service..."
node tools/send_test_logs.js
