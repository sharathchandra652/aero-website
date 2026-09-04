/**
 * Aero Villas Local Test Server
 * Serves static website files and mounts /api/leads
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const leadsHandler = require('./api/leads.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount /api/leads
app.post('/api/leads', leadsHandler);
app.options('/api/leads', leadsHandler);

// Serve static frontend root
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`🚀 Aero Villas Local Server running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/leads`);
});
