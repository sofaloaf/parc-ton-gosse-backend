// Simple health check server - runs independently to test if server can start
import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

app.get('/api/health', (req, res) => {
	res.json({ 
		status: 'ok', 
		timestamp: new Date().toISOString(),
		message: 'Health check server is running'
	});
});

app.get('/', (req, res) => {
	res.json({ 
		message: 'Parc Ton Gosse API',
		health: '/api/health',
		status: 'running'
	});
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`✅ Health check server listening on port ${PORT}`);
});

