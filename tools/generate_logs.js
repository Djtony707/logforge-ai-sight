
// Test script to generate syslog messages for testing
const dgram = require('dgram');
const net = require('net');

// Configuration
const HOST = 'localhost'; // Change to your ingest service host
const PORT = 514;
const MESSAGE_INTERVAL = 1000; // 1 message per second
const NUM_MESSAGES = 100; // Send this many messages

// Sample data for generating random logs
const HOSTS = [
  'web-server1.example.com',
  'db-server.example.com',
  'app-server.example.com',
  'cache-server.example.com',
  'auth-server.example.com'
];

const APPS = [
  'nginx',
  'postgres',
  'node',
  'redis',
  'auth-service'
];

const SEVERITIES = {
  0: 'emerg',
  1: 'alert',
  2: 'crit',
  3: 'err',
  4: 'warning',
  5: 'notice',
  6: 'info',
  7: 'debug'
};

const MESSAGES = [
  'Connection established with client %IP%',
  'Failed to connect to database after %NUM% attempts',
  'CPU usage at %PERCENT%%%',
  'Memory usage at %PERCENT%%%',
  'User %USER% logged in successfully',
  'Failed login attempt for user %USER%',
  'API request completed in %NUM%ms',
  'Disk space warning: %PERCENT%%% used',
  'Service restarted after %NUM% seconds downtime',
  'New user %USER% registered'
];

// Generate a random syslog message
function generateSyslogMessage() {
  const host = HOSTS[Math.floor(Math.random() * HOSTS.length)];
  const app = APPS[Math.floor(Math.random() * APPS.length)];
  const severityNum = Math.floor(Math.random() * 8);
  const severity = SEVERITIES[severityNum];
  const facility = 1; // user-level messages
  const priority = (facility * 8) + severityNum;
  
  // Get random message and fill in placeholders
  let msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  msg = msg.replace('%IP%', `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
  msg = msg.replace('%NUM%', Math.floor(Math.random() * 100).toString());
  msg = msg.replace('%PERCENT%', Math.floor(Math.random() * 100).toString());
  msg = msg.replace('%USER%', ['john', 'jane', 'admin', 'guest', 'system'][Math.floor(Math.random() * 5)]);
  
  // Format according to RFC 3164 (BSD syslog)
  const now = new Date();
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
  const day = now.getDate().toString().padStart(2, ' ');
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  return `<${priority}>${month} ${day} ${time} ${host} ${app}[${Math.floor(Math.random() * 10000)}]: ${msg}`;
}

// Send a message via UDP
function sendUdpMessage() {
  const message = generateSyslogMessage();
  const client = dgram.createSocket('udp4');
  
  client.send(message, PORT, HOST, (err) => {
    if (err) {
      console.error('Error sending UDP message:', err);
    } else {
      console.log('UDP message sent:', message);
    }
    client.close();
  });
}

// Send a message via TCP
function sendTcpMessage() {
  const message = generateSyslogMessage();
  const client = new net.Socket();
  
  client.connect(PORT, HOST, () => {
    client.write(message);
    console.log('TCP message sent:', message);
    client.destroy();
  });
  
  client.on('error', (err) => {
    console.error('Error sending TCP message:', err);
  });
}

// Start sending messages
console.log(`Sending ${NUM_MESSAGES} syslog messages to ${HOST}:${PORT}...`);

let messagesSent = 0;
const interval = setInterval(() => {
  // Randomly choose between UDP and TCP
  if (Math.random() > 0.5) {
    sendUdpMessage();
  } else {
    sendTcpMessage();
  }
  
  messagesSent++;
  
  if (messagesSent >= NUM_MESSAGES) {
    clearInterval(interval);
    console.log('Done sending messages.');
  }
}, MESSAGE_INTERVAL);
