
// Load testing script for LogForge AI
// This script simulates high log volume to test system performance

const dgram = require('dgram');
const net = require('net');
const { program } = require('commander');

program
  .option('-h, --host <host>', 'Host address', 'localhost')
  .option('-p, --port <port>', 'Syslog port', '514')
  .option('-c, --count <count>', 'Number of logs to send', '1000')
  .option('-r, --rate <rate>', 'Logs per second', '100')
  .option('-t, --type <type>', 'Protocol type: udp or tcp', 'udp')
  .option('-s, --severity <severity>', 'Log severity: 0-7', '6')
  .parse();

const options = program.opts();
const HOST = options.host;
const PORT = parseInt(options.port);
const COUNT = parseInt(options.count);
const RATE = parseInt(options.rate);
const TYPE = options.type.toLowerCase();
const SEVERITY = parseInt(options.severity);

// Current timestamp in syslog format
const getTimestamp = () => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[now.getMonth()]} ${now.getDate().toString().padStart(2, ' ')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
};

// Generate random hostnames
const hosts = ['webserver01', 'webserver02', 'dbserver01', 'dbserver02', 'appserver01', 'appserver02', 'loadbalancer01', 'cache01'];
// Generate random applications
const applications = ['nginx', 'apache', 'postgresql', 'mysql', 'redis', 'mongodb', 'node', 'python'];
// Generate different message patterns
const messagePatterns = [
  'Connection established from {ip}',
  'User {user} logged in successfully',
  'Failed login attempt for user {user} from {ip}',
  'CPU usage at {percent}%',
  'Memory usage at {percent}%',
  'Disk usage at {percent}%',
  'Request completed in {ms}ms',
  'Database query executed in {ms}ms',
  '{count} requests processed',
  'Error: {errorcode} - {errormsg}',
  'Warning: {warncode} - {warnmsg}',
  'Service {service} restarted'
];

// Random IP generator
const randomIp = () => {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
};

// Random username generator
const randomUser = () => {
  const users = ['admin', 'user', 'guest', 'system', 'root', 'john', 'jane', 'david', 'sarah', 'mike'];
  return users[Math.floor(Math.random() * users.length)];
};

// Generate a random syslog message
const generateMessage = () => {
  const host = hosts[Math.floor(Math.random() * hosts.length)];
  const app = applications[Math.floor(Math.random() * applications.length)];
  const messagePattern = messagePatterns[Math.floor(Math.random() * messagePatterns.length)];
  
  // Replace placeholders with random values
  let message = messagePattern
    .replace('{ip}', randomIp())
    .replace('{user}', randomUser())
    .replace('{percent}', Math.floor(Math.random() * 100))
    .replace('{ms}', Math.floor(Math.random() * 5000))
    .replace('{count}', Math.floor(Math.random() * 10000))
    .replace('{errorcode}', Math.floor(Math.random() * 100))
    .replace('{errormsg}', 'Unexpected server error')
    .replace('{warncode}', Math.floor(Math.random() * 100))
    .replace('{warnmsg}', 'Performance degraded')
    .replace('{service}', app);
  
  // Format: <PRI>TIMESTAMP HOST APP-NAME: MESSAGE
  const pri = `<${(SEVERITY * 8) + 1}>`; // Facility=0 (kernel), Severity=variable
  return `${pri}${getTimestamp()} ${host} ${app}[${Math.floor(Math.random() * 10000)}]: ${message}`;
};

// Send logs using UDP
const sendUdpLogs = () => {
  const client = dgram.createSocket('udp4');
  let sent = 0;
  
  console.log(`Sending ${COUNT} UDP syslog messages to ${HOST}:${PORT} at ${RATE} logs/sec`);
  
  const interval = setInterval(() => {
    const batchSize = Math.min(RATE, COUNT - sent);
    
    for (let i = 0; i < batchSize; i++) {
      const message = generateMessage();
      client.send(message, PORT, HOST, (err) => {
        if (err) console.error(`Error sending message: ${err}`);
      });
    }
    
    sent += batchSize;
    process.stdout.write(`\rSent: ${sent}/${COUNT} logs (${Math.round(sent/COUNT*100)}%)`);
    
    if (sent >= COUNT) {
      clearInterval(interval);
      client.close();
      console.log('\nCompleted sending UDP logs.');
    }
  }, 1000);
};

// Send logs using TCP
const sendTcpLogs = () => {
  let sent = 0;
  console.log(`Sending ${COUNT} TCP syslog messages to ${HOST}:${PORT} at ${RATE} logs/sec`);
  
  const client = new net.Socket();
  
  client.connect(PORT, HOST, () => {
    const interval = setInterval(() => {
      const batchSize = Math.min(RATE, COUNT - sent);
      
      for (let i = 0; i < batchSize; i++) {
        const message = generateMessage() + '\n';
        client.write(message);
      }
      
      sent += batchSize;
      process.stdout.write(`\rSent: ${sent}/${COUNT} logs (${Math.round(sent/COUNT*100)}%)`);
      
      if (sent >= COUNT) {
        clearInterval(interval);
        client.end();
        console.log('\nCompleted sending TCP logs.');
      }
    }, 1000);
  });
  
  client.on('error', (err) => {
    console.error(`TCP connection error: ${err}`);
  });
};

// Start sending logs
console.log(`LogForge AI Load Test Tool`);
console.log(`-------------------------`);
if (TYPE === 'udp') {
  sendUdpLogs();
} else if (TYPE === 'tcp') {
  sendTcpLogs();
} else {
  console.error(`Invalid protocol type: ${TYPE}. Use 'udp' or 'tcp'.`);
}
