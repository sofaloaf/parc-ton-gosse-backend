import fs from 'fs';
import { google } from 'googleapis';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Sheets
const auth = new google.auth.JWT(
	process.env.GS_SERVICE_ACCOUNT,
	null,
	process.env.GS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
	['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

// Read CSV
const csvContent = fs.readFileSync('./sample-activities.csv', 'utf8');
const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

console.log(`Found ${parsed.data.length} activities to import`);

// Prepare data
const headers = Object.keys(parsed.data[0]);
const rows = [
	headers,
	...parsed.data.map(row => headers.map(h => row[h]))
];

// Write to Google Sheets
try {
	await sheets.spreadsheets.values.update({
		spreadsheetId: process.env.GS_SHEET_ID,
		range: 'Activities!A1',
		valueInputOption: 'RAW',
		resource: { values: rows }
	});
	
	console.log('✅ Successfully imported activities to Google Sheets!');
	console.log(`✅ Imported ${parsed.data.length} activities`);
} catch (error) {
	console.error('❌ Error importing to Google Sheets:', error.message);
	process.exit(1);
}

