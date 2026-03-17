import { Client, Databases, Permission, Role } from "node-appwrite";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY; // You need to create this in Appwrite Console

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing required environment variables. Please check your .env file.");
  console.error("Required: VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const DATABASE_ID = "finance_db";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setupDatabase() {
  console.log("🚀 Starting Appwrite Database Setup...");

  try {
    // 1. Create Database
    console.log(`\n📦 Creating Database: ${DATABASE_ID}`);
    try {
      await databases.create(DATABASE_ID, "WealthTracker Database");
      console.log("✅ Database created successfully.");
    } catch (error) {
      if (error.code === 409) {
        console.log("ℹ️ Database already exists. Skipping creation.");
      } else {
        throw error;
      }
    }

    // 2. Create Collections
    const collections = [
      { id: "users", name: "Profiles" },
      { id: "accounts", name: "Accounts" },
      { id: "transactions", name: "Transactions" },
      { id: "categories", name: "Categories" },
      { id: "budgets", name: "Budgets" },
      { id: "goals", name: "Goals" },
    ];

    for (const col of collections) {
      console.log(`\n📁 Creating Collection: ${col.name} (${col.id})`);
      try {
        await databases.createCollection(
          DATABASE_ID,
          col.id,
          col.name,
          [
            Permission.create(Role.users()),
            Permission.read(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
          ],
          true // Document Level Security = ON
        );
        console.log(`✅ Collection ${col.id} created.`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️ Collection ${col.id} already exists.`);
        } else {
          console.error(`❌ Error creating collection ${col.id}:`, error.message);
        }
      }
    }

    // 3. Create Attributes (Simplified for demonstration)
    console.log("\n⏳ Creating Attributes (This takes a moment)...");
    
    // Users
    await databases.createStringAttribute(DATABASE_ID, "users", "userId", 36, true);
    await databases.createStringAttribute(DATABASE_ID, "users", "name", 128, true);
    await databases.createStringAttribute(DATABASE_ID, "users", "email", 128, true);
    await databases.createStringAttribute(DATABASE_ID, "users", "currency", 3, false, "USD");
    await databases.createStringAttribute(DATABASE_ID, "users", "theme", 10, false, "dark");
    await databases.createFloatAttribute(DATABASE_ID, "users", "monthlyIncomeGoal", false, 0);
    await databases.createFloatAttribute(DATABASE_ID, "users", "netWorthTarget", false, 0);

    // Accounts
    await databases.createStringAttribute(DATABASE_ID, "accounts", "userId", 36, true);
    await databases.createStringAttribute(DATABASE_ID, "accounts", "name", 128, true);
    await databases.createStringAttribute(DATABASE_ID, "accounts", "type", 32, true);
    await databases.createFloatAttribute(DATABASE_ID, "accounts", "balance", true);
    await databases.createStringAttribute(DATABASE_ID, "accounts", "currency", 3, false, "USD");
    await databases.createStringAttribute(DATABASE_ID, "accounts", "institution", 128, false);
    await databases.createBooleanAttribute(DATABASE_ID, "accounts", "isDefault", false, false);

    // Transactions
    await databases.createStringAttribute(DATABASE_ID, "transactions", "userId", 36, true);
    await databases.createStringAttribute(DATABASE_ID, "transactions", "accountId", 36, true);
    await databases.createStringAttribute(DATABASE_ID, "transactions", "categoryId", 36, true);
    await databases.createFloatAttribute(DATABASE_ID, "transactions", "amount", true);
    await databases.createDatetimeAttribute(DATABASE_ID, "transactions", "date", true);
    await databases.createStringAttribute(DATABASE_ID, "transactions", "description", 256, true);
    await databases.createStringAttribute(DATABASE_ID, "transactions", "type", 16, true);
    await databases.createStringAttribute(DATABASE_ID, "transactions", "status", 16, false, "cleared");
    
    // Categories
    await databases.createStringAttribute(DATABASE_ID, "categories", "userId", 36, true);
    await databases.createStringAttribute(DATABASE_ID, "categories", "name", 64, true);
    await databases.createStringAttribute(DATABASE_ID, "categories", "type", 16, true);
    await databases.createStringAttribute(DATABASE_ID, "categories", "color", 16, false, "#10B981");
    await databases.createStringAttribute(DATABASE_ID, "categories", "icon", 32, false, "Circle");

    // Budgets
    await databases.createStringAttribute(DATABASE_ID, "budgets", "userId", 36, true);
    await databases.createStringAttribute(DATABASE_ID, "budgets", "categoryId", 36, true);
    await databases.createFloatAttribute(DATABASE_ID, "budgets", "amount", true);
    await databases.createStringAttribute(DATABASE_ID, "budgets", "period", 16, false, "monthly");
    await databases.createDatetimeAttribute(DATABASE_ID, "budgets", "startDate", false);

    // Goals
    await databases.createStringAttribute(DATABASE_ID, "goals", "userId", 36, true);
    await databases.createStringAttribute(DATABASE_ID, "goals", "name", 128, true);
    await databases.createFloatAttribute(DATABASE_ID, "goals", "targetAmount", true);
    await databases.createFloatAttribute(DATABASE_ID, "goals", "currentAmount", false, 0);
    await databases.createDatetimeAttribute(DATABASE_ID, "goals", "targetDate", false);
    await databases.createStringAttribute(DATABASE_ID, "goals", "color", 16, false, "#10B981");
    await databases.createStringAttribute(DATABASE_ID, "goals", "icon", 32, false, "Target");

    console.log("✅ Attributes creation commands sent.");
    console.log("⏳ Waiting 5 seconds for Appwrite to process attributes before creating indexes...");
    await sleep(5000);

    // 4. Create Indexes
    console.log("\n🔍 Creating Indexes...");
    try {
      await databases.createIndex(DATABASE_ID, "users", "idx_userId", "unique", ["userId"], ["ASC"]);
      await databases.createIndex(DATABASE_ID, "accounts", "idx_userId", "key", ["userId"], ["ASC"]);
      await databases.createIndex(DATABASE_ID, "transactions", "idx_userId", "key", ["userId"], ["ASC"]);
      await databases.createIndex(DATABASE_ID, "transactions", "idx_accountId", "key", ["accountId"], ["ASC"]);
      await databases.createIndex(DATABASE_ID, "transactions", "idx_date", "key", ["date"], ["DESC"]);
      await databases.createIndex(DATABASE_ID, "categories", "idx_userId", "key", ["userId"], ["ASC"]);
      await databases.createIndex(DATABASE_ID, "budgets", "idx_user_cat", "key", ["userId", "categoryId"], ["ASC", "ASC"]);
      await databases.createIndex(DATABASE_ID, "goals", "idx_userId", "key", ["userId"], ["ASC"]);
      console.log("✅ Indexes created successfully.");
    } catch (error) {
      console.log("⚠️ Some indexes might already exist or attributes are still processing. You can run this script again later.");
    }

    console.log("\n🎉 Setup Complete! Your Appwrite database is ready to use.");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
  }
}

setupDatabase();
