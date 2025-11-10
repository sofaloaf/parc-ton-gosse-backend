import { createMemoryStore } from './memory.js';
import { createAirtableStore } from './airtable.js';
import { createSheetsStore } from './sheets-enhanced.js';

export async function createDataStore(config) {
	const backend = config.backend;
	if (backend === 'airtable') {
		return createAirtableStore(config.airtable);
	}
	if (backend === 'sheets') {
		return createSheetsStore(config.sheets);
	}
	return createMemoryStore();
}

