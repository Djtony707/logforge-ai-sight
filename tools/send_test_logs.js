
#!/usr/bin/env node

const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const fs = require('fs');
const path = require('path');

// LogForge server address
const SERVER_HOST = process.argv[2] || 'localhost';
const SERVER_PORT = 514;

// Sample log messages
const SAMPLE_LOGS = [
  '<34>1 2023-05-14T12:00:00Z webserver-01 nginx - - - GET /index.html 200 1234',
  '<34>1 2023-05-14T12:00:10Z webserver-01 nginx - - - GET /about.html 200 567',
  '<34>1 2023-05-14T12:00:20Z webserver-01 nginx - - - GET /api/v1/users 200 890',
  '<34>1 2023-05-14T12:00:30Z webserver-02 nginx - - - GET /api/v1/products 200 1200',
  '<34>1 2023-05-14T12:00:40Z webserver-02 nginx - - - GET /api/v1/orders 200 950',
  '<78>1 2023-05-14T12:01:00Z db-server-01 postgres - - - connection established',
  '<78>1 2023-05-14T12:01:10Z db-server-01 postgres - - - database "customers" selected',
  '<78>1 2023-05-14T12:01:20Z db-server-01 postgres - - - transaction begin',
  '<78>1 2023-05-14T12:01:30Z db-server-01 postgres - - - transaction committed',
  '<46>1 2023-05-14T12:02:00Z auth-server-01 sshd - - - Failed password for invalid user test from 192.168.1.100 port 58204 ssh2',
  '<46>1 2023-05-14T12:02:10Z auth-server-01 sshd - - - Failed password for admin from 192.168.1.101 port 58205 ssh2',
  '<46>1 2023-05-14T12:02:20Z auth-server-01 sshd - - - Failed password for admin from 192.168.1.101 port 58206 ssh2',
  '<46>1 2023-05-14T12:02:30Z auth-server-01 sshd - - - Failed password for admin from 192.168.1.101 port 58207 ssh2',
  '<46>1 2023-05-14T12:02:40Z auth-server-01 sshd - - - Authentication failure for admin from 192.168.1.101',
  '<38>1 2023-05-14T12:03:00Z app-server-01 app - - - Application started successfully',
  '<38>1 2023-05-14T12:03:10Z app-server-01 app - - - Processing user request #12345',
  '<36>1 2023-05-14T12:03:20Z app-server-01 app - - - Warning: High memory usage (85%)',
  '<35>1 2023-05-14T12:03:30Z app-server-01 app - - - Error: Unable to connect to database',
  '<34>1 2023-05-14T12:03:40Z app-server-01 app - - - Critical: Service unavailable',
];

console.log(`Sending test logs to ${SERVER_HOST}:${SERVER_PORT}...`);

// Send logs with a delay between each
let i = 0;
const interval = setInterval(() => {
  const message = SAMPLE_LOGS[i % SAMPLE_LOGS.length];
  const buffer = Buffer.from(message);
  
  client.send(buffer, SERVER_PORT, SERVER_HOST, (err) => {
    if (err) {
      console.error(`Error sending message: ${err.message}`);
    } else {
      console.log(`Sent: ${message}`);
    }
  });
  
  i++;
  
  // Stop after sending all logs once
  if (i >= SAMPLE_LOGS.length) {
    clearInterval(interval);
    setTimeout(() => {
      client.close();
      console.log('All test logs sent!');
    }, 1000);
  }
}, 1000);

// Handle errors
client.on('error', (err) => {
  console.error(`Client error: ${err.message}`);
  client.close();
});
