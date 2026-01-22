import fs from "fs";
import path from "path";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pictogramsPath = path.join(__dirname, "pictograms.json");
console.log("Leyendo:", pictogramsPath);

const data = JSON.parse(fs.readFileSync(pictogramsPath, "utf-8"));

const client = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const outputDir = path.join(__dirname, "audio", "es");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
async function generateAll() {
  for (const p of data.pictograms) {
    const outputPath = path.join(outputDir, p.file);

    if (fs.existsSync(outputPath)) {
      console.log(`⏭ Ya existe: ${p.file}`);
      continue;
    }

    const command = new SynthesizeSpeechCommand({
      Text: p.text,
      OutputFormat: "mp3",
      VoiceId: data.voice,
      LanguageCode: data.language
    });

    const response = await client.send(command);
    const buffer = Buffer.from(await response.AudioStream.transformToByteArray());

    fs.writeFileSync(outputPath, buffer);
    console.log(`✔ Generado: ${p.file}`);
  }
}

generateAll().catch(console.error);
