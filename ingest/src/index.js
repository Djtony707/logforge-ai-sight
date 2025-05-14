
const { startUdpServer, startTcpServer } = require('./syslog-listener');

// Default syslog port is 514
const SYSLOG_PORT = 514;

// Start syslog servers
startUdpServer(SYSLOG_PORT);
startTcpServer(SYSLOG_PORT);

console.log(`Syslog ingest service started on port ${SYSLOG_PORT} (UDP/TCP)`);
