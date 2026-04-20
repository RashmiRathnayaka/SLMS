const mongoose = require('mongoose');
const dns = require('node:dns');

const connectDB = async () => {
  try {
    if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb+srv://')) {
      const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

      // Some local resolvers refuse SRV lookups used by mongodb+srv URIs.
      dns.setServers(dnsServers);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
