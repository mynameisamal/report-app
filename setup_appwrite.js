import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.VITE_APPWRITE_DATABASE;

// Set permissions so anyone can read/write (since this is client-side app)
const permissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any())
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup() {
    try {
        console.log("🛠️ Memulai proses pembuatan struktur Appwrite...");

        // 1. PROFILES
        console.log("➡️ Membuat tabel 'profiles'...");
        await databases.createCollection(dbId, 'profiles', 'profiles', permissions);
        await databases.createStringAttribute(dbId, 'profiles', 'full_name', 255, true);
        await databases.createStringAttribute(dbId, 'profiles', 'role', 50, true);
        await databases.createStringAttribute(dbId, 'profiles', 'username', 100, true);
        await sleep(1500); // Tunggu Appwrite memproses attribute

        // 2. TASKS
        console.log("➡️ Membuat tabel 'tasks'...");
        await databases.createCollection(dbId, 'tasks', 'tasks', permissions);
        await databases.createStringAttribute(dbId, 'tasks', 'title', 255, true);
        await databases.createStringAttribute(dbId, 'tasks', 'github_link', 255, false);
        await databases.createStringAttribute(dbId, 'tasks', 'instructions', 5000, false);
        await databases.createStringAttribute(dbId, 'tasks', 'target_date', 100, false);
        await databases.createStringAttribute(dbId, 'tasks', 'assigned_to', 255, false);
        await databases.createStringAttribute(dbId, 'tasks', 'created_by', 255, true);
        await databases.createStringAttribute(dbId, 'tasks', 'status', 50, true);
        await sleep(1500);

        // 3. DAILY REPORTS
        console.log("➡️ Membuat tabel 'daily_reports'...");
        await databases.createCollection(dbId, 'daily_reports', 'daily_reports', permissions);
        await databases.createStringAttribute(dbId, 'daily_reports', 'user_id', 255, true);
        await databases.createStringAttribute(dbId, 'daily_reports', 'date', 100, true);
        await databases.createStringAttribute(dbId, 'daily_reports', 'content', 15000, true);
        await databases.createIntegerAttribute(dbId, 'daily_reports', 'tasks_completed', true);
        await databases.createBooleanAttribute(dbId, 'daily_reports', 'is_auto', false, false);

        console.log("\n✅ BERHASIL! Semua tabel dan kolom telah dibuat dengan perizinan penuh.");
    } catch (error) {
        console.error("❌ GAGAL:", error.message);
    }
}

setup();
