import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVATAR_DIR = path.join(__dirname, '../public/avatars');
const COUNT = 100;

async function downloadAvatars() {
    console.log(`Starting download of ${COUNT} avatars to ${AVATAR_DIR}...`);

    if (!fs.existsSync(AVATAR_DIR)) {
        fs.mkdirSync(AVATAR_DIR, { recursive: true });
    }

    for (let i = 1; i <= COUNT; i++) {
        const seed = i; // Use ID as seed to match Marketplace logic
        const url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;
        const filePath = path.join(AVATAR_DIR, `${i}.svg`);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            const svgContent = await response.text();
            fs.writeFileSync(filePath, svgContent);
            console.log(`Downloaded ${i}.svg`);
        } catch (error) {
            console.error(`Error downloading ${i}.svg:`, error);
        }

        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('Done updating avatars!');
}

downloadAvatars();
