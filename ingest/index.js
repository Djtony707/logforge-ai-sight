
const dgram = require('dgram');
const net = require('net');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables from .env file if present
dotenv.config();

// Configure PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'logforge',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'logforge_db',
});

// Test database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection failed:', err);
    // Continue running even if DB connection fails initially
  } else {
    console.log('Database connection successful');
  }
});

// Parse syslog message format
function parseSyslogMessage(message) {
  try {
    // Convert Buffer to string if needed
    const msg = message.toString('utf8');
    
    // RFC5424 format: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
    const rfc5424Regex = /^<(\d+)>(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(?:\[([^\]]*)\]\s+)?(.+)$/;
    
    // RFC3164 format: <PRI>TIMESTAMP HOSTNAME APP[PID]: MSG
    const rfc3164Regex = /<(\d+)>(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(\S+)(?:\[(\d+)\])?:\s+(.*)/;
    
    let match = msg.match(rfc5424Regex) || msg.match(rfc3164Regex);
    
    if (match) {
      const priority = parseInt(match[1], 10);
      const severity = priority % 8;
      const facility = Math.floor(priority / 8);
      const host = match[3] || match[4];
      const app = match[4] || match[5];
      const message = match[8] || match[6];
      
      return {
        id: uuidv4(),
        ts: new Date().toISOString(),
        host: host,
        app: app,
        facility,
        severity: mapSeverity(severity),
        msg: message,
      };
    } else {
      // Last resort fallback parsing
      const parts = msg.split(' ');
      return {
        id: uuidv4(),
        ts: new Date().toISOString(),
        host: parts.length > 2 ? parts[2] : 'unknown',
        app: parts.length > 4 ? parts[4].split('[')[0] : 'unknown',
        facility: 1, // Default to user-level facility
        severity: 'info', // Default to info severity
        msg: msg,
      };
    }
  } catch (error) {
    console.error('Error parsing syslog message:', error);
    return {
      id: uuidv4(),
      ts: new Date().toISOString(),
      host: 'unknown',
      app: 'unknown',
      facility: 1,
      severity: 'error',
      msg: message.toString('utf8'),
    };
  }
}

// Map numeric severity to named severity levels
function mapSeverity(level) {
  const severityMap = {
    0: 'emergency',
    1: 'alert',
    2: 'critical',
    3: 'error',
    4: 'warning',
    5: 'notice',
    6: 'info',
    7: 'debug'
  };
  return severityMap[level] || 'info';
}

// Insert log into database and notify clients
async function processLog(log) {
  try {
    // Insert log into database
    const query = `
      INSERT INTO logs(id, ts, host, app, severity, msg)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [log.id, log.ts, log.host, log.app, log.severity, log.msg];
    
    const result = await pool.query(query, values);
    
    // Notify WebSocket clients using Postgres NOTIFY
    if (result.rows.length > 0) {
      const logJson = JSON.stringify(result.rows[0]);
      await pool.query(`SELECT pg_notify('new_log', $1)`, [logJson]);
      
      // Trigger alert check (in a real system, this would be more sophisticated)
      await checkAlerts(log);
    }
    
    console.log(`Log processed: ${log.host} - ${log.app} - ${log.severity} - ${log.msg.substring(0, 50)}`);
  } catch (error) {
    console.error('Error saving log to database:', error);
  }
}

// Check if log triggers any alerts
async function checkAlerts(log) {
  try {
    // Get all active alerts
    const alertsResult = await pool.query(`
      SELECT id, name, severity, query 
      FROM alerts 
      WHERE is_active = true
    `);
    
    for (const alert of alertsResult.rows) {
      let isTriggered = false;
      
      // Simple query matching (in production this would be more sophisticated)
      if (log.severity === alert.severity && log.msg.includes(alert.query)) {
        isTriggered = true;
      }
      
      if (isTriggered) {
        // Update alert last_triggered time
        await pool.query(`
          UPDATE alerts 
          SET last_triggered = CURRENT_TIMESTAMP 
          WHERE id = $1
        `, [alert.id]);
        
        // Insert into alert history
        await pool.query(`
          INSERT INTO alert_history(alert_id, log_ids)
          VALUES($1, $2)
        `, [alert.id, [log.id]]);
        
        // Notify clients about the triggered alert
        const alertNotification = {
          alert_id: alert.id,
          alert_name: alert.name,
          severity: alert.severity,
          log_id: log.id,
          triggered_at: new Date().toISOString()
        };
        
        await pool.query(`SELECT pg_notify('new_alert', $1)`, [JSON.stringify(alertNotification)]);
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
}

// Setup UDP server (port 514)
const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
  console.error('UDP server error:', err);
  udpServer.close();
});

udpServer.on('message', async (msg, rinfo) => {
  console.log(`UDP message from ${rinfo.address}:${rinfo.port}`);
  const logEntry = parseSyslogMessage(msg);
  await processLog(logEntry);
});

udpServer.on('listening', () => {
  const address = udpServer.address();
  console.log(`UDP server listening on ${address.address}:${address.port}`);
});

udpServer.bind(514);

// Setup TCP server (port 514)
const tcpServer = net.createServer((socket) => {
  console.log('TCP client connected');
  
  socket.on('data', async (data) => {
    console.log(`TCP data received`);
    const logEntry = parseSyslogMessage(data);
    await processLog(logEntry);
  });
  
  socket.on('error', (err) => {
    console.error('TCP socket error:', err);
  });
});

tcpServer.on('error', (err) => {
  console.error('TCP server error:', err);
});

tcpServer.listen(514, () => {
  console.log('TCP server listening on port 514');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  udpServer.close();
  tcpServer.close();
  pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  udpServer.close();
  tcpServer.close();
  pool.end();
  process.exit(0);
});
