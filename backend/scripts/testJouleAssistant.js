const axios = require('axios');
const logger = require('../config/logger');

const testJoule = async () => {
    const chatUrl = 'http://localhost:3000/api/v1/terminal/chat';
    
    console.log('--- TEST 1: RICERCA NUMERICA (Classifica RP) ---');
    try {
        const res1 = await axios.post(chatUrl, {
            message: "Qual è la carta con la difesa (RP) più alta nel database?"
        }, {
            headers: { 'x-user': 'TestUser' }
        });
        console.log('Risposta IA:', res1.data.reply);
        
        console.log('\n--- TEST 2: ANALISI REGOLAMENTO + GAME STATE ---');
        const res2 = await axios.post(chatUrl, {
            message: "Ho in campo una carta Plasma e l'avversario ha 18 IT. Se infliggo un danno con una carta Plasma, questo turno, quanto IT gli rimane?",
            gameState: { playerIT: 20, enemyIT: 18, activeEffects: ["Plasma Strike"] }
        }, {
            headers: { 'x-user': 'TestUser' }
        });
        console.log('Risposta IA:', res2.data.reply);

        console.log('\n✅ TEST ASSISTENTE JOULE COMPLETATO.');
        process.exit(0);
    } catch (error) {
        console.error('❌ ERRORE TEST:', error.response?.data || error.message);
        process.exit(1);
    }
};

testJoule();
