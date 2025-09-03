import dotenv from "dotenv";
import { getDb } from "../src/db/connection.js";
import { buildDefaultMeta } from "../src/db/schemas.js";

dotenv.config();

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randPhone() {
  const a = () => Math.floor(Math.random() * 900 + 100);
  const b = () => Math.floor(Math.random() * 9000 + 1000);
  return `+1-${a()}-${a()}-${b()}`;
}

function approximateDOB(ageYears) {
  const now = new Date();
  const dob = new Date(now);
  dob.setFullYear(now.getFullYear() - ageYears);
  return dob;
}

function samplePatients() {
  const patients = [
    {
      firstName: "John",
      lastName: "Doe",
      age: 45,
      sex: "M",
      contact: { phone: randPhone(), email: "john.doe@example.com" },
      identifiers: [{ system: "MRN", value: "MRN-10001" }],
      medicalHistory: {
        allergies: ["Penicillin"],
        conditions: ["Hypertension"],
        medications: ["Lisinopril"],
        notes: "Smoker, advised cessation."
      }
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      age: 33,
      sex: "F",
      contact: { phone: randPhone(), email: "jane.smith@example.com" },
      identifiers: [{ system: "MRN", value: "MRN-10002" }],
      medicalHistory: {
        allergies: [],
        conditions: ["Asthma"],
        medications: ["Albuterol"],
        notes: null
      }
    },
    {
      firstName: "Alex",
      lastName: "Kim",
      age: 27,
      sex: "O",
      contact: { phone: randPhone(), email: "alex.kim@example.com" },
      identifiers: [{ system: "MRN", value: "MRN-10003" }],
      medicalHistory: {
        allergies: ["Peanuts"],
        conditions: [],
        medications: [],
        notes: "Carries EpiPen."
      }
    }
  ].map(p => ({
    ...p,
    dateOfBirth: approximateDOB(p.age),
    meta: buildDefaultMeta("seed")
  }));
  return patients;
}

function sampleTriages(patientDocs) {
  const priorities = ["Immediate", "Very Urgent", "Urgent", "Standard", "Non-Urgent"];
  const statuses = ["Open", "In Progress", "Completed", "Cancelled"];
  const triages = [];

  patientDocs.forEach(p => {
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 triage entries per patient
    for (let i = 0; i < count; i++) {
      const when = new Date();
      when.setDate(when.getDate() - Math.floor(Math.random() * 30));
      triages.push({
        patientId: p._id,
        triageTime: when,
        priority: randFrom(priorities),
        status: randFrom(statuses),
        nurse: randFrom(["nurse.alex", "nurse.beth", "nurse.cole"]),
        doctor: randFrom(["dr.lee", "dr.patel", "dr.nguyen", null]),
        vitals: {
          heartRate: 60 + Math.floor(Math.random() * 40),
          bloodPressure: `${100 + Math.floor(Math.random() * 40)}/${60 + Math.floor(Math.random() * 30)}`,
          respiratoryRate: 12 + Math.floor(Math.random() * 8),
          temperatureC: 36 + Math.random() * 2,
          oxygenSaturation: 94 + Math.floor(Math.random() * 6)
        },
        notes: "Patient assessed and stabilized.",
        meta: buildDefaultMeta("seed")
      });
    }
  });

  return triages;
}

async function seed({ drop = false } = {}) {
  const { client, db } = await getDb();
  try {
    if (drop) {
      console.log("Dropping existing data...");
      await db.collection("triage_entries").deleteMany({});
      await db.collection("patients").deleteMany({});
      await db.collection("system_metadata").deleteMany({});
    }

    const patients = samplePatients();
    const patientResult = await db.collection("patients").insertMany(patients);
    const patientDocs = await db
      .collection("patients")
      .find({ _id: { $in: Object.values(patientResult.insertedIds) } })
      .toArray();

    const triages = sampleTriages(patientDocs);
    await db.collection("triage_entries").insertMany(triages);

    await db.collection("system_metadata").updateOne(
      { key: "seed-info" },
      {
        $set: {
          key: "seed-info",
          value: {
            patients: patients.length,
            triages: triages.length
          },
          category: "system",
          description: "Seed data statistics"
        },
        $setOnInsert: {
          meta: { ...buildDefaultMeta("seed") }
        },
        $currentDate: {
          "meta.updatedAt": true
        }
      },
      { upsert: true }
    );

    console.log(`Seed complete: ${patients.length} patients, ${triages.length} triage entries.`);
  } finally {
    await client.close();
  }
}

const shouldDrop = process.argv.includes("--drop");
seed({ drop: shouldDrop }).catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
