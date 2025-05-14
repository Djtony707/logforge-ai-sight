
const { startUdpServer, startTcpServer } = require('./syslog-listener');

const SYSLOG_PORT = process.env.SYSLOG_PORT || 514;

// Start syslog servers
startUdpServer(SYSLOG_PORT);
startTcpServer(SYSLOG_PORT);

console.log(`Syslog ingest service started on port ${SYSLOG_PORT} (UDP/TCP)`);
