import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

/**
 * Get a connected MongoDB client and db instance using environment variables.
 * PUBLIC_INTERFACE
 */
export async function getDb() {
  /**
   * Returns a connected MongoDB database instance and the underlying client.
   * - Reads MONGODB_URL and MONGODB_DB from environment variables.
   * - Caller is responsible for calling client.close() when finished.
   */
  const url = process.env.MONGODB_URL;
  const dbName = process.env.MONGODB_DB;

  if (!url || !dbName) {
    throw new Error(
      "Missing MongoDB configuration. Ensure MONGODB_URL and MONGODB_DB are set."
    );
  }

  const client = new MongoClient(url, {
    // Reasonable defaults for serverless/script usage
    maxPoolSize: 10,
    minPoolSize: 0
  });
  await client.connect();
  const db = client.db(dbName);
  return { client, db };
}
