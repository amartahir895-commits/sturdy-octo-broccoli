const env = require("../../settings.js");
const fs = require("fs");
const path = require("path");

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const handler = async (m, { conn, text, args, usedPrefix }) => {
    // Validasi minimal 3 argumen
    if (!args || args.length < 3) {
        return m.reply(`Format: ${usedPrefix}pushkontak <id_grup> <delay_ms> <pesan>\nContoh: ${usedPrefix}pushkontak 120363421327333985@g.us 3000 wokk`);
    }

    // Parse arguments
    let idgc = args[0];
    let delayMs = parseInt(args[1]);
    let teks = args.slice(2).join(" "); // Ambil semua kata setelah delay

    // Validasi
    if (!idgc.includes('@g.us')) {
        return m.reply('❌ Format ID grup salah! Contoh: 120363421327333985@g.us');
    }
    
    if (isNaN(delayMs) || delayMs < 1000) {
        return m.reply('❌ Delay minimal 1000ms (1 detik)!');
    }
    
    if (!teks.trim()) {
        return m.reply('❌ Pesan tidak boleh kosong!');
    }

    try {
        // Ambil member grup
        const metadata = await conn.groupMetadata(idgc);
        const members = metadata.participants.map(p => p.id);
        
        if (members.length === 0) {
            return m.reply('❌ Grup kosong!');
        }

        await m.reply(`🚀 Mulai push "${teks}" ke ${members.length} member...`);
        
        let sukses = 0;
        let gagal = 0;
        let listNomor = [];

        // Proses pengiriman
        for (let i = 0; i < members.length; i++) {
            const jid = members[i];
            
            // Skip bot dan sender
            if (jid === conn.user.id || jid === m.sender) continue;
            
            try {
                await conn.sendMessage(jid, {
                    text: teks,
                    mentions: [jid]
                });
                
                listNomor.push(jid.split("@")[0]);
                sukses++;
                
                // Progress update
                if ((i + 1) % 10 === 0) {
                    await conn.sendMessage(m.chat, {
                        text: `📊 ${i + 1}/${members.length} (${Math.round(((i + 1) / members.length) * 100)}%)`
                    });
                }
                
            } catch (e) {
                gagal++;
                console.error(`Gagal ke ${jid}:`, e.message);
            }
            
            // Delay
            if (i < members.length - 1) {
                await delay(delayMs);
            }
        }

        // Save VCF
        const folder = env.savepushkontak || "./temp";
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
        
        const vcfFile = path.join(folder, `contacts-${Date.now()}.vcf`);
        let vcfContent = "";
        
        listNomor.forEach((nomor, idx) => {
            vcfContent += 
`BEGIN:VCARD
VERSION:3.0
FN:Contact-${idx + 1}
TEL:${nomor}
END:VCARD

`;
        });
        
        fs.writeFileSync(vcfFile, vcfContent);

        // Result
        m.reply(`
✅ *SELESAI*
👥 Target: ${members.length} member
✅ Berhasil: ${sukses}
❌ Gagal: ${gagal}
⏰ Delay: ${delayMs}ms
📁 VCF: ${vcfFile}

📝 Pesan: ${teks.substring(0, 50)}${teks.length > 50 ? '...' : ''}
        `);

    } catch (error) {
        console.error(error);
        m.reply('❌ Error: ' + error.message);
    }
};

handler.command = ['pushkontak'];
handler.owner = true;
module.exports = handler;