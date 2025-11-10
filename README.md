# Parc Ton Gosse – Bilingual Activities Marketplace (Paris)

Monorepo structure:
- `server/`: Node.js Express API
- `client/`: React (Vite) frontend

## Quick Start

### Option 1: Automated Start (Recommended) 🚀

**Using the startup script:**
```bash
# Make sure dependencies are installed first:
cd server && npm install
cd ../client && npm install

# Then start everything:
./start.sh
# OR
npm start
```

This will:
- ✅ Start the backend server on port 4000
- ✅ Start the frontend client on port 5173
- ✅ Automatically open your browser to http://localhost:5173

### Option 2: Manual Start

**1) Server**
- Create `.env` in `server/`:
```
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATA_BACKEND=memory # or 'airtable' or 'sheets'
JWT_SECRET=change-me

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Airtable (optional)
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# Google Sheets (optional)
GS_SERVICE_ACCOUNT=
GS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GS_SHEET_ID=

# Email/SMS (optional stubs by default)
SENDGRID_API_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
TWILIO_SID=
TWILIO_TOKEN=
```
- Install & run:
```
cd server
npm install
npm run dev
```

2) Client
- Create `.env` in `client/`:
```
VITE_API_URL=http://localhost:4000/api
```
- Install & run:
```
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## API Overview
- `POST /api/auth/signup` `{ email, password, role: 'parent'|'provider'|'admin', profile }`
- `POST /api/auth/login`
- `GET /api/activities` filters: `category,minAge,maxAge,startDate,endDate,minPrice,maxPrice,neighborhood,q`
- `GET /api/activities/:id`
- `POST /api/activities` (provider/admin)
- `PUT /api/activities/:id` (provider/admin)
- `DELETE /api/activities/:id` (provider/admin)
- `GET /api/users` (admin)
- `GET /api/users/:id` (self/admin)
- `PUT /api/users/:id` (self/admin)
- `DELETE /api/users/:id` (admin)
- `GET /api/registrations` (provider/admin)
- `POST /api/registrations` (parent)
- `PUT /api/registrations/:id` (provider/admin)
- `DELETE /api/registrations/:id` (self/admin)
- `GET /api/reviews`
- `POST /api/reviews` (parent)
- `PUT /api/reviews/:id/moderate` (admin)
- `GET /api/i18n` `GET /api/i18n/:locale` `PUT /api/i18n/:locale/:key` (admin)
- `POST /api/payments/create-payment-intent` (parent)
- `POST /api/payments/webhook` (Stripe)
- `POST /api/import/csv/activities` (admin) - Upload CSV file to import activities

## Data Backends

### Memory (Default)
- Used when `DATA_BACKEND=memory` or not set. Good for development/testing.
- Data is stored in memory and lost on server restart.

### Google Sheets Integration

**1. Create a Google Cloud Project:**
   - Go to https://console.cloud.google.com/
   - Create a new project (or use existing)
   - Enable "Google Sheets API"

**2. Create Service Account:**
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name it (e.g., "parc-ton-gosse-api")
   - Click "Create and Continue" > "Done"

**3. Generate JSON Key:**
   - Click on the service account you created
   - Go to "Keys" tab > "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file

**4. Extract Credentials from JSON:**
   Open the downloaded JSON file. You'll need:
   - `client_email` → This is your `GS_SERVICE_ACCOUNT`
   - `private_key` → This is your `GS_PRIVATE_KEY`

**5. Create/Configure Google Sheet:**
   - Create a new Google Sheet (or use existing)
   - Share it with the service account email (from step 4) with "Editor" permissions
   - Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

**6. Configure Environment:**
   Add to `server/.env`:
   ```env
   DATA_BACKEND=sheets
   GS_SERVICE_ACCOUNT=your-service-account@project-id.iam.gserviceaccount.com
   GS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   GS_SHEET_ID=your-sheet-id-from-url
   ```
   **Important:** Keep the quotes around `GS_PRIVATE_KEY` and preserve the `\n` line breaks.

**7. Sheet Structure (Auto-created):**
   The app will automatically create these sheets if they don't exist:
   - **Activities**: `id`, `title`, `description`, `categories`, `ageMin`, `ageMax`, `price`, `schedule`, `neighborhood`, `images`, `providerId`, `createdAt`, `updatedAt`
   - **Users**: `id`, `email`, `password`, `role`, `profile`, `createdAt`
   - **Registrations**: `id`, `activityId`, `parentId`, `status`, `waitlist`, `form`, `createdAt`, `updatedAt`
   - **Reviews**: `id`, `activityId`, `parentId`, `rating`, `comment`, `status`, `createdAt`, `updatedAt`
   - **i18n**: `locale`, `key`, `value`

**8. Format Notes:**
   - Complex fields (arrays/objects) are stored as JSON strings in cells
   - Example `title`: `{"en":"Music Workshop","fr":"Atelier Musique"}`
   - Example `categories`: `["music","arts"]`

**9. CSV Import Alternative:**
   If you have existing CSV data, you can import it via:
   ```bash
   curl -X POST http://localhost:4000/api/import/csv/activities \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -F "file=@activities.csv"
   ```
   CSV format should have columns: `id`, `title`, `title_en`, `title_fr`, `description`, `description_en`, `description_fr`, `categories`, `ageMin`, `ageMax`, `price`, `neighborhood`, etc.

**10. Install Dependencies & Restart:**
   ```bash
   cd server
   npm install  # Installs googleapis and papaparse
   npm run dev  # Restart server
   ```

**11. Flexible Column Names:**
   The app automatically reads column names from your Google Sheet and maps them correctly!
   - Use `Title EN` or `Title (English)` or `Titre Anglais` → all work!
   - Use `Description FR` or `Description (French)` or `Description Français` → all work!
   - See `GOOGLE-SHEETS-COLUMN-GUIDE.md` for all supported variations
   
   **Sample CSV template:** `sample-activities.csv` in the project root

### Airtable Integration
- Stub implementation ready; add credentials to enable once implemented.

## Internationalization
- UI strings in `client/src/shared/i18n.js`.
- Dynamic keys via backend `i18n` routes; frontend fetches on locale change.

## Notes
- Passwords are stored in-memory in plain text for demo. Replace with hashing + real DB for production.
- Payments use Stripe Payment Intents; integrate Stripe Elements on the client to capture payment details.
- Email/SMS are stubbed; integrate SendGrid/Twilio or SMTP.
# parc-ton-gosse
# parc-ton-gosse
