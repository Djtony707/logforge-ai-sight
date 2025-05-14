
#!/bin/bash

# Make the script executable
chmod +x tools/load_test.js

# Check if commander is installed
if ! npm list -g commander | grep -q commander; then
  echo "Installing commander..."
  npm install -g commander
fi

# Default parameters
HOST="localhost"
PORT="514"
COUNT="1000"
RATE="100"
TYPE="udp"
SEVERITY="6"

# Display usage information
function show_usage() {
  echo "Usage: run_load_test.sh [options]"
  echo ""
  echo "Options:"
  echo "  -h, --host HOST       Host address (default: localhost)"
  echo "  -p, --port PORT       Syslog port (default: 514)"
  echo "  -c, --count COUNT     Number of logs to send (default: 1000)"
  echo "  -r, --rate RATE       Logs per second (default: 100)"
  echo "  -t, --type TYPE       Protocol type: udp or tcp (default: udp)"
  echo "  -s, --severity SEV    Log severity: 0-7 (default: 6)"
  echo "  --help                Display this help message"
  echo ""
}

# Process command-line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -h|--host)
      HOST="$2"
      shift
      shift
      ;;
    -p|--port)
      PORT="$2"
      shift
      shift
      ;;
    -c|--count)
      COUNT="$2"
      shift
      shift
      ;;
    -r|--rate)
      RATE="$2"
      shift
      shift
      ;;
    -t|--type)
      TYPE="$2"
      shift
      shift
      ;;
    -s|--severity)
      SEVERITY="$2"
      shift
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

echo "LogForge AI Load Test"
echo "===================="
echo "Host: $HOST"
echo "Port: $PORT"
echo "Count: $COUNT logs"
echo "Rate: $RATE logs/second"
echo "Protocol: $TYPE"
echo "Severity: $SEVERITY"
echo ""
echo "Starting test..."
echo ""

# Run the load test script
node tools/load_test.js --host "$HOST" --port "$PORT" --count "$COUNT" --rate "$RATE" --type "$TYPE" --severity "$SEVERITY"

echo ""
echo "Load test completed."

