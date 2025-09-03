# patient-triage-records-management-system-94815-94727

This workspace contains the database container for the Patient Triage Records Management System.

Quick start for the MongoDB database (database_triagens):
- Configure environment variables in database_triagens/.env (see .env.example)
- Install dependencies: npm install (inside database_triagens)
- Initialize DB (collections/indexes): npm run init
- Seed sample data: npm run reseed

The backend container should connect using env vars:
- MONGODB_URL
- MONGODB_DB