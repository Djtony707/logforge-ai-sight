
# LogForge AI

A lightweight syslog dashboard that you can run with one command, then open a browser to see live logs, search history, and get local-only AI insights.

## Features

- **Real-time Log Monitoring**: View logs as they arrive via UDP/TCP syslog (port 514)
- **Advanced Search**: Filter logs by time range, host, application, severity level, and message content
- **AI-Powered Insights**: 
  - Anomaly detection using IsolationForest algorithm
  - Pattern analysis to group similar log entries
  - Natural language queries powered by TinyLlama-1.1B
  - Log volume forecasting
- **Alerting System**: Create custom alerts based on log patterns with real-time notifications
- **Responsive Dashboard**: Modern UI that works on desktop and mobile devices
- **Secure Access**: Role-based authentication with admin and viewer roles
- **Local-only Processing**: All data stays on your server for maximum privacy and security

## Quick Start

### Prerequisites

- Ubuntu 20.04 LTS or newer
- Docker and Docker Compose installed

### Step 1: Install Docker

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

### Step 2: Install Docker Compose

```bash
# Download the current stable release of Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Apply executable permissions
sudo chmod +x /usr/local/bin/docker-compose

# Test the installation
docker-compose --version
```

### Step 3: Deploy LogForge AI

1. Clone the repository:
```bash
git clone https://github.com/yourusername/logforge-ai.git
cd logforge-ai
```

2. Edit the `.env` file with your preferred settings:
```bash
# Make a copy of the example environment file
cp .env.example .env

# Edit the .env file with your preferred text editor
nano .env
```

3. Build and start all services:
```bash
make prod
# Or alternatively:
# docker-compose up -d
```

4. Access the dashboard:
Open your browser and navigate to http://your-server-ip:3000

## Directory Structure

```
logforge-ai/
├── api/                  # FastAPI backend
├── db/init/              # Database initialization scripts
├── ingest/               # Syslog ingest service
├── ai_anomaly/           # Anomaly detection service
├── ai_forecast/          # Log volume forecasting service
├── tools/                # Utility scripts
├── ui/                   # Frontend Dockerfile
├── src/                  # Frontend source code
├── docker-compose.yml    # Main Docker Compose file
├── docker-compose.dev.yml # Development overrides
└── .env                  # Environment configuration
```

## Configuring Log Sources

To send logs to LogForge AI, configure your systems to forward syslog messages to your LogForge server:

### For rsyslog (most Linux distributions):

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

### For systemd-journald:

```bash
# Install systemd-journal-remote
sudo apt-get install -y systemd-journal-remote

# Configure remote forwarding
sudo tee /etc/systemd/journal-upload.conf > /dev/null <<EOT
[Upload]
URL=http://logforge-server-ip:19532
EOT

# Enable and start the service
sudo systemctl enable --now systemd-journal-upload.service
```

## Default Login Credentials

- **Admin**: username `admin`, password `admin`
- **Viewer**: username `viewer`, password `viewer`

**Important**: Change these default credentials after first login!

## Troubleshooting

### Common Issues

1. **Logs not appearing**:
   - Check if your source systems are correctly forwarding logs to port 514
   - Verify network connectivity and firewall settings
   - Run `docker-compose logs ingest` to check for connection issues

2. **UI cannot connect to API**:
   - Make sure the API_URL in .env is correctly set to an address accessible from your browser
   - If using a reverse proxy, ensure proper WebSocket forwarding

3. **High CPU/Memory usage**:
   - Adjust resource limits in docker-compose.yml
   - Consider disabling AI features if system resources are limited
   - Monitor with `docker stats`

4. **Database connection issues**:
   - Check the database logs with `docker-compose logs db`
   - Verify the database credentials in your .env file

For more help, check the logs:
```bash
# View all logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f api
```

## License

MIT License
