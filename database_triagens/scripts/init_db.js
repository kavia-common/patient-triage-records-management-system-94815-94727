import dotenv from "dotenv";
import { getDb } from "../src/db/connection.js";
import {
  patientSchema,
  triageEntrySchema,
  systemMetadataSchema
} from "../src/db/schemas.js";

dotenv.config();

/**
 * Initialize collections with validators and indexes.
 * - patients
 * - triage_entries
 * - system_metadata
 */
async function ensureCollections(db) {
  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  const names = new Set(existing.map(c => c.name));

  async function createOrUpdateCollection(name, validator, options = {}) {
    if (!names.has(name)) {
      await db.createCollection(name, { validator, validationLevel: "moderate", ...options });
      console.log(`✓ Created collection: ${name}`);
    } else {
      // Update validator in case it changed
      await db.command({
        collMod: name,
        validator,
        validationLevel: "moderate"
      });
      console.log(`↻ Updated validator for: ${name}`);
    }
  }

  await createOrUpdateCollection("patients", patientSchema);
  await createOrUpdateCollection("triage_entries", triageEntrySchema);
  await createOrUpdateCollection("system_metadata", systemMetadataSchema);
}

/**
 * Create indexes to optimize typical queries.
 */
async function ensureIndexes(db) {
  // Patients
  await db.collection("patients").createIndexes([
    { key: { lastName: 1, firstName: 1 }, name: "name_compound" },
    { key: { "contact.phone": 1 }, name: "contact_phone" },
    { key: { "identifiers.system": 1, "identifiers.value": 1 }, name: "identifier_system_value" },
    // Text index for search across names and medical text fields
    {
      key: {
        firstName: "text",
        lastName: "text",
        "medicalHistory.allergies": "text",
        "medicalHistory.conditions": "text",
        "medicalHistory.medications": "text"
      },
      name: "patient_text_search"
    }
  ]);
  console.log("✓ Patient indexes ensured");

  // Triage entries
  await db.collection("triage_entries").createIndexes([
    { key: { patientId: 1, triageTime: -1 }, name: "by_patient_time" },
    { key: { priority: 1, triageTime: -1 }, name: "by_priority_time" },
    { key: { status: 1, triageTime: -1 }, name: "by_status_time" }
  ]);
  console.log("✓ Triage indexes ensured");

  // System metadata
  await db.collection("system_metadata").createIndexes([
    { key: { key: 1 }, unique: true, name: "key_unique" },
    { key: { category: 1 }, name: "by_category" }
  ]);
  console.log("✓ System metadata indexes ensured");
}

async function main() {
  const { client, db } = await getDb();
  try {
    console.log(`Initializing database "${db.databaseName}"...`);
    await ensureCollections(db);
    await ensureIndexes(db);
    console.log("Database initialization complete.");
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error("Initialization failed:", err);
  process.exit(1);
});
