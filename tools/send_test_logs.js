
#!/usr/bin/env node
const dgram = require('dgram');
const net = require('net');

// Configuration
const HOST = process.env.HOST || 'localhost';
const PORT = parseInt(process.env.PORT || '514', 10);
const PROTOCOL = (process.env.PROTOCOL || 'udp').toLowerCase();
const COUNT = parseInt(process.env.COUNT || '10', 10);
const INTERVAL = parseInt(process.env.INTERVAL || '1000', 10);

// Sample log templates
const templates = [
  '<134>Feb 10 12:43:05 server1 nginx: 192.168.1.10 - - [10/Feb/2023:12:43:05 +0000] "GET /api/health HTTP/1.1" 200 53 "-" "Mozilla/5.0"',
  '<131>Feb 10 12:43:17 db-server postgres: [843-1] LOG:  database system is ready to accept connections',
  '<132>Feb 10 12:44:22 app-server app: User login successful: john.doe@example.com',
  '<131>Feb 10 12:45:32 web-frontend node: Server listening on port 3000',
  '<133>Feb 10 12:46:05 server1 systemd: Started Application Server.',
  '<130>Feb 10 12:47:18 cache-server redis: 1:M 10 Feb 2023 12:47:18.472 * Ready to accept connections',
  '<135>Feb 10 12:48:47 load-balancer haproxy: Server app/app1 is UP, reason: Layer7 check passed',
  '<131>Feb 10 12:49:22 monitoring prometheus: Scrape completed',
  '<134>Feb 10 12:50:05 server1 nginx: 192.168.1.15 - - [10/Feb/2023:12:50:05 +0000] "POST /api/users HTTP/1.1" 201 42 "-" "PostmanRuntime/7.29.0"',
  '<132>Feb 10 12:51:33 auth-server auth: New user registered: alice@example.com',
];

// Random severity logs
const generateErrorLog = () => {
  const services = ['nginx', 'postgres', 'app', 'redis', 'haproxy', 'auth'];
  const service = services[Math.floor(Math.random() * services.length)];
  const hosts = ['server1', 'db-server', 'app-server', 'web-frontend', 'cache-server', 'load-balancer'];
  const host = hosts[Math.floor(Math.random() * hosts.length)];
  const errors = [
    'Connection refused',
    'Permission denied',
    'Disk space critical',
    'Out of memory',
    'Authentication failed',
    'Service unavailable',
    'Timeout exceeded',
    'Invalid configuration',
    'Database connection lost',
    'CPU usage critical'
  ];
  const error = errors[Math.floor(Math.random() * errors.length)];
  
  return `<131>Feb 10 ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${host} ${service}: ERROR: ${error}`;
};

// Generate random log entry
const generateRandomLog = () => {
  // 20% chance to generate an error log
  if (Math.random() < 0.2) {
    return generateErrorLog();
  }
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  // Randomize the timestamp a bit
  const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  
  return template.replace(/\d{2}:\d{2}:\d{2}/, `${hours}:${minutes}:${seconds}`);
};

// Send logs via UDP
const sendUdpLog = (message) => {
  const client = dgram.createSocket('udp4');
  
  client.send(message, PORT, HOST, (err) => {
    if (err) {
      console.error('Error sending UDP log:', err);
    } else {
      console.log(`[UDP] Sent: ${message}`);
    }
    client.close();
  });
};

// Send logs via TCP
const sendTcpLog = async (message) => {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.connect(PORT, HOST, () => {
      client.write(message, () => {
        console.log(`[TCP] Sent: ${message}`);
        client.end();
        resolve();
      });
    });
    
    client.on('error', (err) => {
      console.error('Error sending TCP log:', err);
      reject(err);
    });
    
    client.on('close', () => {
      resolve();
    });
  });
};

// Send logs based on protocol
const sendLog = async () => {
  const message = generateRandomLog();
  
  if (PROTOCOL === 'tcp') {
    await sendTcpLog(message);
  } else {
    sendUdpLog(message);
  }
};

// Main function
const main = async () => {
  console.log(`Sending ${COUNT} logs to ${HOST}:${PORT} via ${PROTOCOL.toUpperCase()} with ${INTERVAL}ms interval`);
  
  for (let i = 0; i < COUNT; i++) {
    await sendLog();
    
    if (i < COUNT - 1) {
      await new Promise(resolve => setTimeout(resolve, INTERVAL));
    }
  }
  
  console.log('All logs sent!');
};

// Execute the script
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
