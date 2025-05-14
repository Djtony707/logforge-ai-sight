
# LogForge AI Backup and Restore Guide

This guide explains how to backup and restore your LogForge AI system.

## Automated Backups

LogForge AI includes an automated backup system that:

1. Creates daily database backups at 2:00 AM
2. Stores backups in the `backup_data` Docker volume
3. Retains backups for the configured number of days (default: 7)
4. Rotates logs daily to prevent disk space issues

### Configuration

Backup settings can be modified in the `.env` file:

```
BACKUP_ENABLED=true
BACKUP_INTERVAL=86400  # 24 hours (in seconds)
BACKUP_RETENTION=7     # How many days to keep backups
BACKUP_PATH=/backups   # Path inside the backup container
```

## Manual Backup

To manually trigger a backup:

```bash
docker-compose exec backup /backup_db.sh
```

## Restoring from Backup

To restore from a backup:

1. List available backups:
   ```bash
   docker-compose exec backup ls -la /backups
   ```

2. Stop the running services:
   ```bash
   docker-compose down
   ```

3. Start just the database:
   ```bash
   docker-compose up -d db
   ```

4. Restore the backup (replace DATE with the actual backup date):
   ```bash
   docker-compose exec -it db bash
   pg_restore -h localhost -U logforge -d logforge_db -c /backups/logforge_DATE.pgdump
   exit
   ```

5. Restart all services:
   ```bash
   docker-compose up -d
   ```

## Exporting Backups from Docker Volume

To copy a backup from the Docker volume to the host system:

```bash
# Create a temporary container to access the backup volume
docker run --rm -v logforge_backup_data:/backups -v $(pwd):/export alpine cp /backups/logforge_DATE.pgdump /export/

# The backup will now be in your current directory
```

## Log Rotation

Logs are automatically rotated daily and compressed after one day. Old logs are deleted after 7 days to preserve disk space.

Log rotation configuration can be found in `tools/logrotate.conf`.
