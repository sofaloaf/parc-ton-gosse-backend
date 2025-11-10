import express from 'express';
import { Client } from '@googlemaps/google-maps-services-js';

const router = express.Router();
const mapsClient = process.env.GOOGLE_MAPS_API_KEY ? new Client({}) : null;

// Geocode a single address
router.post('/', async (req, res) => {
	if (!mapsClient || !process.env.GOOGLE_MAPS_API_KEY) {
		return res.status(503).json({ error: 'Google Maps API not configured' });
	}

	const { address, city = 'Paris, France' } = req.body;
	if (!address) return res.status(400).json({ error: 'Address required' });

	try {
		const response = await mapsClient.geocode({
			params: {
				address: `${address}, ${city}`,
				key: process.env.GOOGLE_MAPS_API_KEY
			}
		});

		if (response.data.results && response.data.results.length > 0) {
			const result = response.data.results[0];
			const location = result.geometry.location;
			return res.json({
				lat: location.lat,
				lng: location.lng,
				formattedAddress: result.formatted_address,
				address: address
			});
		}

		return res.status(404).json({ error: 'Address not found' });
	} catch (error) {
		console.error('Geocoding error:', error.message);
		return res.status(500).json({ error: 'Geocoding failed', details: error.message });
	}
});

// Batch geocode multiple addresses
router.post('/batch', async (req, res) => {
	if (!mapsClient || !process.env.GOOGLE_MAPS_API_KEY) {
		return res.status(503).json({ error: 'Google Maps API not configured' });
	}

	const { addresses, city = 'Paris, France' } = req.body;
	if (!Array.isArray(addresses)) return res.status(400).json({ error: 'Addresses must be an array' });

	try {
		const results = await Promise.allSettled(
			addresses.map(async (addr) => {
				const response = await mapsClient.geocode({
					params: {
						address: `${addr}, ${city}`,
						key: process.env.GOOGLE_MAPS_API_KEY
					}
				});
				if (response.data.results && response.data.results.length > 0) {
					const location = response.data.results[0].geometry.location;
					return {
						address: addr,
						lat: location.lat,
						lng: location.lng,
						formattedAddress: response.data.results[0].formatted_address
					};
				}
				return { address: addr, error: 'Not found' };
			})
		);

		return res.json({
			results: results.map(r => r.status === 'fulfilled' ? r.value : { address: 'unknown', error: r.reason.message })
		});
	} catch (error) {
		console.error('Batch geocoding error:', error.message);
		return res.status(500).json({ error: 'Batch geocoding failed', details: error.message });
	}
});

export default router;

