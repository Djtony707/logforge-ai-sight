
# LogForge AI

Single-box syslog dashboard that you can run with one command, then open a browser to see live logs, search history, and get local-only AI insights.

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
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Add Docker repository
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

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

### Starting LogForge AI

1. Clone the repository:
```bash
git clone https://github.com/yourusername/logforge-ai.git
cd logforge-ai
```

2. Create an `.env` file:
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
Open your browser and navigate to http://localhost:3000

### Default Login Credentials

- Admin: username `admin`, password `admin`
- Viewer: username `viewer`, password `viewer`

## Hardware Requirements

- Minimum: 8 CPU cores, 16 GB RAM
- Recommended: 16 CPU cores, 32 GB RAM

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

## Directory Structure

- `/ingest` - Node.js syslog listener
- `/db` - Database initialization scripts
- `/api` - FastAPI backend
- `/ui` - React frontend
- `/ai_anomaly` - Anomaly detection service
- `/ai_nl` - Natural language query processing
- `/ai_forecast` - Log volume forecasting
- `/ai_summary` - Optional log summarization (disabled by default)

## Development

Check the Makefile for development targets:

```bash
make dev    # Start development environment
make test   # Run tests
make prod   # Start production environment
```
