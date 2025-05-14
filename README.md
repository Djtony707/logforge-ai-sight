
# LogForge AI

Single-box syslog dashboard that you can run with one command, then open a browser to see live logs, search history, and get local-only AI insights.

## Features

- **Real-time Log Monitoring**: View logs as they arrive via UDP/TCP syslog (port 514)
- **Advanced Search**: Filter logs by time range, host, application, severity level, and message content
- **AI-Powered Insights**: Anomaly detection, pattern analysis, and natural language queries
- **Alerting System**: Create custom alerts based on log patterns with real-time notifications
- **Responsive Dashboard**: Modern UI that works on desktop and mobile devices
- **Secure Access**: Role-based authentication with admin and viewer roles
- **Local-only Processing**: All data stays on your server for maximum privacy

## Quick Start (5 minutes)

### Prerequisites

- Ubuntu 20.04 LTS or newer
- Docker and Docker Compose installed

### Ubuntu Setup

1. Install Docker:

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
sudo apt-get update

# Install Docker CE
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Add your user to the docker group to run docker without sudo
sudo usermod -aG docker $USER

# Apply the new group membership (logout and login again or run the following)
newgrp docker
```

2. Install Docker Compose:

```bash
# Download the current stable release of Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Apply executable permissions
sudo chmod +x /usr/local/bin/docker-compose

# Test the installation
docker-compose --version
```

### Setting up LogForge AI

1. Clone the repository:
```bash
git clone https://github.com/yourusername/logforge-ai.git
cd logforge-ai
```

2. Create and configure the `.env` file:
```bash
cp .env.example .env
# Edit the .env file with your preferred text editor
nano .env
```

3. Start the application:
```bash
docker-compose up -d
```

4. Access the dashboard:
Open your browser and navigate to http://your-server-ip:3000

### Configuring Log Sources

To send logs to LogForge AI, configure your systems to forward syslog messages to your LogForge server:

#### For rsyslog (most Linux distributions):

Add this to `/etc/rsyslog.conf` or create a new file in `/etc/rsyslog.d/`:

```
# Send logs to LogForge AI
*.* @logforge-server-ip:514  # UDP
# OR
*.* @@logforge-server-ip:514  # TCP
```

Then restart rsyslog:

```bash
sudo systemctl restart rsyslog
```

### Default Login Credentials

- **Admin**: username `admin`, password `admin`
- **Viewer**: username `viewer`, password `viewer`

**Important**: Change these default credentials after first login!

## Hardware Requirements

- **Minimum**: 8 CPU cores, 16 GB RAM
- **Recommended**: 16 CPU cores, 32 GB RAM

## AI Features

LogForge AI includes several powerful AI capabilities to help you analyze and understand your logs:

### Real-time Anomaly Detection

- Automatically identifies unusual log patterns that may indicate issues
- Uses statistical and machine learning techniques to detect outliers
- Updates in real-time as new logs arrive

### Pattern Analysis

- Groups similar log entries together to identify recurring patterns
- Replaces variable data with placeholders for easier recognition
- Shows frequency and examples of each detected pattern

### Natural Language Queries

- Ask questions about your logs in plain English
- "Show me all failed login attempts in the last hour"
- "What are the top error messages today?"

### Log Volume Forecasting

- Predicts future log volume based on historical data
- Helps with capacity planning and anomaly detection
- 7-day forecast updated daily

## Alerting System

Create custom alerts based on log patterns:

- Define alert severity levels (info, warning, error, critical)
- Set query patterns to match against incoming logs
- Receive real-time notifications when alerts are triggered
- View alert history and manage notifications

## Enabling the AI Summarizer

The AI summarizer (Mistral-7B) is disabled by default as it requires more resources.

To enable it:

1. Uncomment the `ai_summary` service in the `docker-compose.yml` file
2. Adjust its resource limits if needed
3. Restart the application:
```bash
docker-compose down
docker-compose up -d
```

## System Architecture

- `/ingest` - Node.js syslog listener (UDP/TCP port 514)
- `/db` - PostgreSQL 16 + TimescaleDB + pgvector for time-series and vector storage
- `/api` - FastAPI backend with REST and WebSocket endpoints
- `/ui` - React 18 frontend with Vite, TailwindCSS, and shadcn components
- `/ai_anomaly` - Python IsolationForest for anomaly detection
- `/ai_nl` - Ollama TinyLlama-1.1B for natural language processing
- `/ai_forecast` - Prophet for log volume forecasting
- `/ai_summary` - Optional Mistral-7B for advanced log summarization

## Development

Check the Makefile for development targets:

```bash
make dev    # Start development environment
make test   # Run tests
make prod   # Start production environment
make clean  # Clean up containers and volumes
```

## Security Considerations

- Change the default credentials immediately after installation
- For production use, configure proper firewalls to restrict access to ports
- Consider running behind a reverse proxy with HTTPS for secure remote access
- Regularly update the system and docker images

## Troubleshooting

### Common Issues

1. **Logs not appearing**:
   - Check if your source systems are correctly forwarding logs to port 514
   - Verify network connectivity and firewall settings

2. **High CPU/Memory usage**:
   - Adjust resource limits in docker-compose.yml
   - Consider disabling AI features if system resources are limited

For more help, check the logs:
```bash
docker-compose logs -f
```

## License

MIT License
