import express from 'express';
import { requireAuth } from '../middleware/auth.js';

export const i18nRouter = express.Router();

i18nRouter.get('/', async (req, res) => {
	const store = req.app.get('dataStore');
	res.json(await store.i18n.getAll());
});

i18nRouter.get('/:locale', async (req, res) => {
	const store = req.app.get('dataStore');
	res.json(await store.i18n.getLocale(req.params.locale));
});

i18nRouter.put('/:locale/:key', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	const { locale, key } = req.params;
	const { value } = req.body;
	const result = await store.i18n.setKey(locale, key, value);
	res.json(result);
});


