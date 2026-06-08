import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.VITE_APPWRITE_DATABASE;

async function seed() {
    try {
        console.log("Mengecek isi tabel profiles...");
        const profs = await databases.listDocuments(dbId, 'profiles');
        
        if(profs.documents.length === 0) {
            console.log("Tabel kosong. Mengisi data awal (Seeding)...");
            
            // Buat Lead
            await databases.createDocument(dbId, 'profiles', ID.unique(), {
                 full_name: 'Amal Lead', role: 'lead', username: 'amal'
            });
            
            // Buat Developer
            await databases.createDocument(dbId, 'profiles', ID.unique(), {
                 full_name: 'Developer Satu', role: 'developer', username: 'dev1'
            });
            
            console.log("✅ Data Amal (Lead) dan Dev1 (Developer) berhasil dimasukkan ke Appwrite!");
        } else {
            console.log("Sudah ada data di tabel profiles.");
        }
    } catch(e) {
        console.error("Gagal melakukan seeding:", e.message);
    }
}
seed();
