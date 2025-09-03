import { ObjectId } from "mongodb";

/**
 * Common metadata fields for auditing and extensibility.
 */
export const metadataSchema = {
  bsonType: "object",
  additionalProperties: true,
  properties: {
    createdAt: { bsonType: "date", description: "Creation timestamp" },
    updatedAt: { bsonType: "date", description: "Last update timestamp" },
    createdBy: { bsonType: ["string", "null"], description: "User ID/email of creator" },
    updatedBy: { bsonType: ["string", "null"], description: "User ID/email of last updater" },
    source: { bsonType: ["string", "null"], description: "Origin of record (system/app)" },
    version: { bsonType: ["int", "long", "null"], description: "Application-level version for optimistic concurrency" },
    tags: {
      bsonType: ["array", "null"],
      items: { bsonType: "string" },
      description: "Arbitrary tags"
    }
  }
};

/**
 * Patient collection schema.
 * Stores patient demographics and history used in triage workflows.
 */
export const patientSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["firstName", "lastName", "sex", "contact", "meta"],
    additionalProperties: true,
    properties: {
      _id: {},
      firstName: { bsonType: "string", description: "Given name" },
      lastName: { bsonType: "string", description: "Family name" },
      dateOfBirth: {
        bsonType: ["date", "null"],
        description: "Date of birth (prefer date, not age)"
      },
      age: {
        bsonType: ["int", "long", "null"],
        description: "Age in years (derived if DOB available)"
      },
      sex: {
        bsonType: "string",
        enum: ["M", "F", "O", "U"],
        description: "Sex: M=Male, F=Female, O=Other, U=Unknown"
      },
      contact: {
        bsonType: "object",
        required: ["phone"],
        properties: {
          phone: { bsonType: "string" },
          email: { bsonType: ["string", "null"] },
          address: {
            bsonType: ["object", "null"],
            properties: {
              line1: { bsonType: ["string", "null"] },
              line2: { bsonType: ["string", "null"] },
              city: { bsonType: ["string", "null"] },
              state: { bsonType: ["string", "null"] },
              postalCode: { bsonType: ["string", "null"] },
              country: { bsonType: ["string", "null"] }
            }
          }
        }
      },
      identifiers: {
        bsonType: ["array", "null"],
        items: {
          bsonType: "object",
          required: ["system", "value"],
          properties: {
            system: { bsonType: "string", description: "Identifier namespace (e.g., MRN)" },
            value: { bsonType: "string", description: "Identifier value" },
            assigner: { bsonType: ["string", "null"] }
          }
        }
      },
      medicalHistory: {
        bsonType: ["object", "null"],
        properties: {
          allergies: { bsonType: ["array", "null"], items: { bsonType: "string" } },
          conditions: { bsonType: ["array", "null"], items: { bsonType: "string" } },
          medications: { bsonType: ["array", "null"], items: { bsonType: "string" } },
          notes: { bsonType: ["string", "null"] }
        }
      },
      emergencyContact: {
        bsonType: ["object", "null"],
        properties: {
          name: { bsonType: ["string", "null"] },
          relationship: { bsonType: ["string", "null"] },
          phone: { bsonType: ["string", "null"] }
        }
      },
      meta: metadataSchema
    }
  }
};

/**
 * Triage entry schema.
 * Stores triage interactions including date, priority, clinician, status, and notes.
 */
export const triageEntrySchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["patientId", "triageTime", "priority", "status", "meta"],
    additionalProperties: true,
    properties: {
      _id: {},
      patientId: { bsonType: "objectId", description: "Reference to patients._id" },
      triageTime: { bsonType: "date", description: "When triage occurred" },
      priority: {
        bsonType: "string",
        enum: ["Immediate", "Very Urgent", "Urgent", "Standard", "Non-Urgent"],
        description: "Triage priority/category"
      },
      status: {
        bsonType: "string",
        enum: ["Open", "In Progress", "Completed", "Cancelled"],
        description: "Workflow status"
      },
      nurse: { bsonType: ["string", "null"], description: "Nurse user ID/name" },
      doctor: { bsonType: ["string", "null"], description: "Doctor user ID/name" },
      vitals: {
        bsonType: ["object", "null"],
        properties: {
          heartRate: { bsonType: ["double", "int", "long", "null"] },
          bloodPressure: { bsonType: ["string", "null"] },
          respiratoryRate: { bsonType: ["double", "int", "long", "null"] },
          temperatureC: { bsonType: ["double", "int", "long", "null"] },
          oxygenSaturation: { bsonType: ["double", "int", "long", "null"] }
        }
      },
      notes: { bsonType: ["string", "null"], description: "Free-form notes" },
      attachments: {
        bsonType: ["array", "null"],
        items: {
          bsonType: "object",
          properties: {
            type: { bsonType: ["string", "null"] },
            url: { bsonType: ["string", "null"] },
            description: { bsonType: ["string", "null"] }
          }
        }
      },
      meta: metadataSchema
    }
  }
};

/**
 * Metadata (system-level) schema.
 * For storing audit logs, system settings, and general metadata entries.
 */
export const systemMetadataSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["key", "meta"],
    additionalProperties: true,
    properties: {
      _id: {},
      key: { bsonType: "string", description: "Unique key for metadata item" },
      value: {},
      category: { bsonType: ["string", "null"], description: "Grouping category" },
      description: { bsonType: ["string", "null"] },
      meta: metadataSchema
    }
  }
};

/**
 * Helper to build default metadata values with timestamps.
 * PUBLIC_INTERFACE
 */
export function buildDefaultMeta(user = "system") {
  /**
   * Returns a metadata object with createdAt/updatedAt and createdBy/updatedBy set.
   */
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: user,
    updatedBy: user,
    version: 1,
    source: "database_triagens"
  };
}

/**
 * PUBLIC_INTERFACE
 * Convert a string id into ObjectId safely. Returns null if invalid.
 */
export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}
