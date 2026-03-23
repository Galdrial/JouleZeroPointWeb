require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ASSISTANT_ID = process.env.ASSISTANT_ID;

async function updateModel() {
  console.log("Tentativo di iniezione neurale con modello o4-mini...");
  try {
    await openai.beta.assistants.update(ASSISTANT_ID, {
      model: "gpt-4o-mini",
      reasoning_effort: null
    });
    console.log("SUCCESS: Modello aggiornato con successo a o4-mini. L'infrastruttura Assistants V2 ha accettato l'upgrade.");
  } catch (error) {
    console.error("FAILED - Errore durante l'aggiornamento a o4-mini:", error.message);
  }
}

updateModel();
