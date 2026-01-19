const axios = require("axios");
const fs = require("fs");
const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");

// ============================================
// 👇 YAHAN APNE GROUP KI ID LAGAYEIN (Ab ye 2 IDs support karega)
const TARGET_GROUP_ID = ["120363406119792604@g.us", "120363307286104671@g.us"]; 
// ============================================

// Global Variables
let isFetching = false;
let timer = null;
const DB_FILE = "./otp_history.json"; 

// ==== API LIST ====
const API_URLS = [
    "https://api-kami-nodejs-production.up.railway.app/api?type=sms",
    "https://kamina-otp.up.railway.app/d-group/sms",
    "https://kamina-otp.up.railway.app/npm-neon/sms"
];

// ==== DATABASE FUNCTIONS ====
function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify([]));
        return [];
    }
    try {
        const data = fs.readFileSync(DB_FILE);
        return JSON.parse(data);
    } catch (e) { return []; }
}

function saveToDatabase(id) {
    const currentData = loadDatabase();
    if (!currentData.includes(id)) {
        currentData.push(id);
        if (currentData.length > 3000) currentData.shift(); 
        fs.writeFileSync(DB_FILE, JSON.stringify(currentData, null, 2));
    }
}

// ==== COUNTRY DETECTION ====
const COUNTRY_MAP = {
    "92": "Pakistan 🇵🇰", "234": "Nigeria 🇳🇬", "269": "Comoros 🇰🇲", "91": "India 🇮🇳",
    "880": "Bangladesh 🇧🇩", "1": "USA/Canada 🇺🇸🇨🇦", "62": "Indonesia 🇮🇩", 
    "44": "UK 🇬🇧", "90": "Turkey 🇹🇷", "966": "Saudi Arabia 🇸🇦", "20": "Egypt 🇪🇬",
    "58": "Venezuela 🇻🇪", "996": "Kyrgyzstan 🇰🇬", "977": "Nepal 🇳🇵"
};

function detectCountry(number) {
    if (!number) return "Unknown 🌐";
    let cleanNum = String(number).replace(/\D/g, ''); 
    for (let i = 4; i >= 1; i--) {
        const prefix = cleanNum.substring(0, i);
        if (COUNTRY_MAP[prefix]) return COUNTRY_MAP[prefix];
    }
    return "Unknown 🌐";
}

// ==== FORMATTING ====
function formatOTPEntry(entry) {
    let date, number, platform, message;

    if (Array.isArray(entry)) {
        date = entry[0]; number = entry[2]; platform = entry[3]; message = entry[4];
    } else {
        date = entry.date || entry.created_at;
        number = entry.number || entry.phone || entry.sender;
        platform = entry.platform || entry.service || "SMS";
        message = entry.message || entry.msg;
    }

    if (!message && !number) return null;

    let otpMatch = message.match(/(\d{3}-\d{3}|\d{4,8})/);
    let otp = otpMatch ? otpMatch[1] : "N/A";
    let numStr = String(number);
    let country = detectCountry(numStr);
    // Number ko thoda sa mask kiya taake clean lage
    let masked = numStr.length > 6 ? numStr.substring(0, 4) + "••••" + numStr.slice(-3) : numStr;

    return `🌍 *Region:* ${country}
📱 *App:* ${platform}
🔢 *Number:* \`+${masked}\`
🔑 *OTP:* *${otp}*
⌚ *Time:* ${date || "Just Now"}

💬 *Message:*
_${message.trim()}_
`;
}

// ==== HANDLER ====
let handler = async (m, { conn, args }) => {
    if (args[0] === 'id') {
        return m.reply(`📝 *Group ID:*\n\`${m.chat}\``);
    }
    else if (args[0] === 'on') {
        if (isFetching) return m.reply('⚠️ System already running!');
        
        try {
            // Updated to handle multiple Group IDs
            for (const jid of TARGET_GROUP_ID) {
                await conn.sendMessage(jid, { text: "🚀 *Bot Started!* \nWide Message Mode: ON" });
            }
        } catch (e) {
            return m.reply("❌ Error: Group ID Check!");
        }

        isFetching = true;
        m.reply("✅ Started.");
        console.log("✅ SYSTEM STARTED");
        startFetching(conn);
    }
    else if (args[0] === 'off') {
        isFetching = false;
        clearInterval(timer);
        m.reply('🛑 Stopped.');
        console.log("🛑 SYSTEM STOPPED");
    }
}

// ==== MAIN LOOP ====
function startFetching(conn) {
    if (timer) clearInterval(timer);

    timer = setInterval(async () => {
        if (!isFetching) return;

        let sentHistory = loadDatabase();

        const requests = API_URLS.map(url => 
            axios.get(url, { 
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            .then(res => ({ status: 'success', url, data: res.data }))
            .catch(err => ({ status: 'error', url, msg: err.message }))
        );

        const results = await Promise.all(requests);

        for (const result of results) {
            if (result.status === 'error') continue;

            let dataArray = [];
            if (result.data.aaData) dataArray = result.data.aaData; 
            else if (Array.isArray(result.data)) dataArray = result.data;
            else if (result.data.messages) dataArray = result.data.messages;

            if (!dataArray || dataArray.length === 0) continue;

            console.log(`✅ Found Data in ${result.url}`);

            for (const entry of dataArray) {
                const uniqueStr = JSON.stringify(entry);
                
                if (!sentHistory.includes(uniqueStr)) {
                    const text = formatOTPEntry(entry);
                    if (text) {
                        console.log(`📤 Sending Message...`);
                        
                        try {
                            // Updated to send to BOTH Group IDs
                            for (const jid of TARGET_GROUP_ID) {
                                await sendButtonMessage(conn, jid, text);
                            }
                            
                            saveToDatabase(uniqueStr);
                            sentHistory.push(uniqueStr);
                        } catch (e) {
                            console.log(`❌ Send Fail: ${e.message}`);
                        }
                        
                        await new Promise(r => setTimeout(r, 1500)); 
                    }
                }
            }
        }
    }, 6000);
}

// ==== BUTTON MESSAGE (FIXED WIDTH) ====
async function sendButtonMessage(conn, jid, text) {
    const ownerLink = "https://wa.me/923195447147"; 
    const channelLink = "https://whatsapp.com/channel/0029VbBEWeUICVfc8ipiWg2q";
    const groupLink = "https://chat.whatsapp.com/LqZNbVcTflF8ssKUFo9om7";

    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: text },
                    footer: { text: "Pσɯҽɾҽԃ Bყ Aɱɱαɾ Hαƈƙҽɾ x Mυɠαʅ Tҽαƈԋ x Zαɱιɳ — Wҽ Aɾҽ Bɾσƚԋҽɾʂ" },
                    // 👇 YE HAI FIX: TITLE ADD KARNE SE MESSAGE CHAURA (WIDE) HO JAYEGA
                    header: { 
                        title: "🔥 NEW OTP RECEIVED", 
                        subtitle: "OTP Service", 
                        hasMediaAttachment: false 
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({ display_text: "DEV 👨‍💻", url: ownerLink, merchant_url: ownerLink })
                            },
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({ display_text: "CHANNEL 📢", url: channelLink, merchant_url: channelLink })
                            },
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({ display_text: "NUMBER GROUP 👥", url: groupLink, merchant_url: groupLink })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: conn.user.jid });

    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
}

handler.command = ['otp'];
handler.tags = ['owner'];
handler.owner = true; 

module.exports = handler;
