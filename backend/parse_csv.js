const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../set5.0.csv');
const jsonFilePath = path.join(__dirname, 'database_preview.json');

const fileContent = fs.readFileSync(csvFilePath, 'utf8');
const lines = fileContent.split('\n');
const headers = lines[0].split('\t').map(h => h.trim());

const cards = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  const values = line.split('\t').map(v => v.trim());
  const data = {};
  headers.forEach((header, index) => {
    data[header] = values[index];
  });

  const cost_et = data['Costo_ET'] ? parseInt(data['Costo_ET'], 10) : null;
  const pep = data['PEP'] ? parseInt(data['PEP'], 10) : null;
  const rp = data['RP'] ? parseInt(data['RP'], 10) : null;

  const card = {
    id: parseInt(data['ID'], 10),
    name: data['Nome'],
    type: data['Tipo'],
    status: data['Stato'],
    cost_et: cost_et === null || isNaN(cost_et) ? null : cost_et,
    pep: pep === null || isNaN(pep) ? null : pep,
    rp: rp === null || isNaN(rp) ? null : rp,
    rarity: data['Rarità'],
    effect: data['Effetto'],
    role: data['Ruolo'],
    image_url: `/assets/cards/${String(data['ID']).padStart(3, '0')}_${data['Nome'].replace(/ /g, '_')}.png`
  };
  
  if (data['Nome']) {
    cards.push(card);
  }
}

fs.writeFileSync(jsonFilePath, JSON.stringify(cards, null, 2));
console.log(`Successfully parsed ${cards.length} cards. Saved to ${jsonFilePath}`);
