
const dgram = require('dgram');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logging
const logFile = path.join(logsDir, 'ingest.log');
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `${timestamp} INFO: ${message}\n`);
    console.log(`${timestamp} INFO: ${message}`);
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `${timestamp} ERROR: ${message} ${error?.stack || error}\n`);
    console.error(`${timestamp} ERROR: ${message}`, error);
  }
};

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'logforge',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'logforge_db'
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection error', err);
  } else {
    logger.info('Database connected successfully');
  }
});

// Parse syslog message
function parseSyslogMessage(message) {
  try {
    // Parse the syslog message
    // This is a simplified parser - production would use a proper syslog parser
    const messageStr = message.toString('utf8').trim();
    
    // Basic pattern: <PRI>TIMESTAMP HOST APP: MESSAGE
    const regex = /<(\d+)>(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(\S+):\s+(.*)/;
    const match = messageStr.match(regex);
    
    if (match) {
      const [, priStr, timestamp, host, app, msg] = match;
      
      // Calculate severity from priority (RFC 5424)
      const priority = parseInt(priStr, 10);
      const severity = priority & 0x07;
      const severityMap = [
        'emergency', 'alert', 'critical', 'error', 
        'warning', 'notice', 'info', 'debug'
      ];
      
      return {
        id: require('crypto').randomUUID(),
        ts: new Date(),
        host,
        app,
        severity: severityMap[severity] || 'info',
        msg
      };
    } else {
      // Fallback parsing for non-standard format
      const parts = messageStr.split(' ');
      return {
        id: require('crypto').randomUUID(),
        ts: new Date(),
        host: parts[0] || 'unknown',
        app: parts[1] || 'unknown',
        severity: 'info',
        msg: parts.slice(2).join(' ') || messageStr
      };
    }
  } catch (error) {
    logger.error('Failed to parse syslog message', error);
    return {
      id: require('crypto').randomUUID(),
      ts: new Date(),
      host: 'unknown',
      app: 'unknown',
      severity: 'error',
      msg: message.toString('utf8').trim()
    };
  }
}

// Store log in database
async function storeLog(logEntry) {
  try {
    const query = `
      INSERT INTO logs (id, ts, host, app, severity, msg)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const values = [
      logEntry.id, 
      logEntry.ts, 
      logEntry.host, 
      logEntry.app, 
      logEntry.severity, 
      logEntry.msg
    ];
    
    const result = await pool.query(query, values);
    
    // Send notification for real-time updates
    if (result.rows.length > 0) {
      const notifyQuery = `
        SELECT pg_notify('new_log', $1)
      `;
      await pool.query(notifyQuery, [JSON.stringify(logEntry)]);
      logger.info(`Log stored and notification sent: ${logEntry.id}`);
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to store log entry', error);
    throw error;
  }
}

// Handle incoming syslog message
function handleSyslogMessage(message, remoteInfo) {
  const logEntry = parseSyslogMessage(message);
  logger.info(`Received log from ${remoteInfo ? `${remoteInfo.address}:${remoteInfo.port}` : 'TCP'}`);
  
  storeLog(logEntry).catch(error => {
    logger.error('Failed to process log entry', error);
  });
}

// Start UDP server
function startUdpServer(port) {
  const server = dgram.createSocket('udp4');
  
  server.on('error', (err) => {
    logger.error('UDP server error', err);
    server.close();
  });
  
  server.on('message', (msg, rinfo) => {
    handleSyslogMessage(msg, rinfo);
  });
  
  server.on('listening', () => {
    const address = server.address();
    logger.info(`UDP server listening on ${address.address}:${address.port}`);
  });
  
  server.bind(port);
  return server;
}

// Start TCP server
function startTcpServer(port) {
  const server = net.createServer((socket) => {
    logger.info(`TCP client connected: ${socket.remoteAddress}:${socket.remotePort}`);
    
    socket.on('data', (data) => {
      handleSyslogMessage(data, null);
    });
    
    socket.on('error', (err) => {
      logger.error(`TCP socket error: ${err.message}`);
    });
  });
  
  server.on('error', (err) => {
    logger.error('TCP server error', err);
  });
  
  server.listen(port, () => {
    logger.info(`TCP server listening on port ${port}`);
  });
  
  return server;
}

module.exports = {
  startUdpServer,
  startTcpServer
};
