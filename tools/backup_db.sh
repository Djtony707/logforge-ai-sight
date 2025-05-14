
#!/bin/bash
# Database backup script for LogForge AI

# Get date in YYYY-MM-DD format
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups"
RETENTION_DAYS=${BACKUP_RETENTION:-7}

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

echo "Starting database backup - $(date)"

# Perform database backup using pg_dump
pg_dump -h db -U ${DB_USER} -d ${DB_NAME} -F c -f ${BACKUP_DIR}/logforge_${DATE}.pgdump

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully: ${BACKUP_DIR}/logforge_${DATE}.pgdump"
  
  # Remove backups older than retention period
  echo "Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
  find ${BACKUP_DIR} -name "logforge_*.pgdump" -type f -mtime +${RETENTION_DAYS} -delete
  
  echo "Backup process completed at $(date)"
else
  echo "Backup failed! Please check the error log."
  exit 1
fi
