import express from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = multer({ dest: join(__dirname, '../uploads/'), limits: { fileSize: 10 * 1024 * 1024 } });
export const importRouter = express.Router();

const uploadsDir = join(__dirname, '../uploads/');
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

importRouter.post('/csv/activities', requireAuth('admin'), upload.single('file'), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
	const store = req.app.get('dataStore');
	const fileContent = fs.readFileSync(req.file.path, 'utf8');
	fs.unlinkSync(req.file.path);
	
	const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
	const errors = [];
	const created = [];
	
	for (const row of parsed.data) {
		try {
			const activity = {
				id: row.id || uuidv4(),
				title: typeof row.title === 'string' && row.title.startsWith('{') ? JSON.parse(row.title) : { en: row.title_en || row.title || '', fr: row.title_fr || row.title || '' },
				description: typeof row.description === 'string' && row.description.startsWith('{') ? JSON.parse(row.description) : { en: row.description_en || row.description || '', fr: row.description_fr || row.description || '' },
				categories: row.categories ? (typeof row.categories === 'string' && row.categories.startsWith('[') ? JSON.parse(row.categories) : row.categories.split(',').map(s => s.trim())) : [],
				ageMin: Number(row.ageMin) || 0,
				ageMax: Number(row.ageMax) || 99,
				price: { amount: Number(row.price) || 0, currency: row.currency || 'eur' },
				schedule: row.schedule ? (typeof row.schedule === 'string' && row.schedule.startsWith('[') ? JSON.parse(row.schedule) : []) : [],
				neighborhood: row.neighborhood || '',
				images: row.images ? (typeof row.images === 'string' && row.images.startsWith('[') ? JSON.parse(row.images) : row.images.split(',').map(s => s.trim())) : [],
				providerId: row.providerId || '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			const result = await store.activities.create(activity);
			created.push(result);
		} catch (e) {
			errors.push({ row, error: e.message });
		}
	}
	
	res.json({ created: created.length, errors: errors.length, createdItems: created, errorDetails: errors });
});
