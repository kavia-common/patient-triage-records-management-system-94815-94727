# database_triagens

MongoDB database container for the Patient Triage Records Management System.

This container defines:
- patients collection: patient demographics, contact, identifiers, and medical history
- triage_entries collection: triage records (time, priority, clinician, status, vitals, notes)
- system_metadata collection: generic key/value metadata for auditing and extensibility

Includes scripts to initialize collections (validators + indexes) and seed sample data.

## Environment variables

Create a .env file in this directory based on .env.example:

- MONGODB_URL: MongoDB connection string (e.g., mongodb://appuser:dbuser123@localhost:5000/?authSource=admin)
- MONGODB_DB: Database name (e.g., myapp)

Optional:
- SEED_BATCH_SIZE: Size for larger seed batches (not required for default seed)

Note: Do not commit real secrets; orchestration layer will populate these for deployed environments.

## Install dependencies

npm install

## Initialize database (collections + indexes)

npm run init

This will:
- Create or update the collections with JSON Schema validators
- Ensure indexes for common queries:
  - Patients: name compound, phone, identifier system/value, and text search
  - Triage entries: by patient+time, by priority+time, by status+time
  - System metadata: unique key

## Seed data

- Seed fresh sample data (drop existing docs first):
  npm run reseed

- Seed without dropping (append):
  npm run seed

After seeding you'll have a few patients and several triage entries per patient.

## Collections

- patients:
  - Example query patterns supported by indexes:
    - Find by name: { lastName, firstName }
    - Find by phone: { "contact.phone": "..." }
    - Find by MRN: { identifiers: { $elemMatch: { system: "MRN", value: "..." } } }
    - Text search: { $text: { $search: "hypertension lisinopril" } }

- triage_entries:
  - Example query patterns supported by indexes:
    - Recent triages for patient: { patientId } sort by triageTime desc
    - Filter by priority or status over time: { priority }, { status }

- system_metadata:
  - Unique key per setting or log pointer etc.

## Integration with backend (Express)

Backend should use the following environment variables to connect:
- MONGODB_URL
- MONGODB_DB

Recommended fields for CRUD and lookup:
- Patient create/update:
  - must include meta.createdBy/meta.updatedBy set from authenticated user, or let the backend set them
- Triage create/update:
  - patientId must be a valid ObjectId (string) referencing patients._id
  - triageTime should be an ISO string/date; backend should convert to Date
  - priority one of: Immediate, Very Urgent, Urgent, Standard, Non-Urgent
  - status one of: Open, In Progress, Completed, Cancelled

The provided JSON Schema validators enforce structure while allowing extensibility via additionalProperties.

## Utilities

- scripts/init_db.js: creates collections with validators and indexes
- scripts/seed_db.js: seeds example patients and triage entries
- src/db/connection.js: MongoDB connection helper using env vars
- src/db/schemas.js: JSON Schemas and helper functions (buildDefaultMeta, toObjectId)

## Notes

This container does not run MongoDB itself; use startup.sh to provision a local mongod if needed in your environment. The db_visualizer tool can be sourced via its env file for quick inspection.

```bash
# example usage
cd database_triagens
cp .env.example .env  # edit if necessary or let orchestrator manage
npm install
npm run init
npm run reseed
```
