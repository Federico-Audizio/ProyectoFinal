import fs from "fs";
import path from "path";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON a procesar
const jsonFiles = ["pictograms.json", "sign.json"];

const client = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function generateFromFile(fileName) {

  const filePath = path.join(__dirname, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠ No existe ${fileName}`);
    return;
  }

  console.log(`📂 Procesando ${fileName}`);

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  let items = [];

  if (data.pictograms) {
    items = data.pictograms;
  } else if (data.sign) {
    items = data.sign;
  } else {
    console.log(`❌ ${fileName} no tiene pictograms ni sign`);
    return;
  }

  const outputDir = path.join(__dirname, "audio", "es");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const item of items) {

    const outputPath = path.join(outputDir, item.file);

    if (fs.existsSync(outputPath)) {
      console.log(`⏭ Ya existe: ${item.file}`);
      continue;
    }

    console.log(`🔊 Generando: ${item.text}`);

    const command = new SynthesizeSpeechCommand({
      Text: item.text,
      OutputFormat: "mp3",
      VoiceId: data.voice || "Lucia",
      LanguageCode: data.language || "es-ES"
    });

    const response = await client.send(command);
    const buffer = Buffer.from(await response.AudioStream.transformToByteArray());

    fs.writeFileSync(outputPath, buffer);

    console.log(`✔ Generado: ${item.file}`);
  }

}

async function generateAll() {

  for (const file of jsonFiles) {
    await generateFromFile(file);
  }

  console.log("✅ Audios generados");
}

generateAll().catch(console.error);
