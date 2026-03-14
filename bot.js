const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ qr, connection }) => {

    if (qr) {
      console.log("Scan this QR with WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Bot Ready");
    }

  });

  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const phone = msg.key.remoteJid.replace("@s.whatsapp.net", "");
    const message = msg.message.conversation || "";

    console.log("Incoming:", phone, message);

    try {

      const response = await axios.post(
        "https://property-doctors-crm.vercel.app/api/whatsapp/incoming",
        {
          phone: phone,
          message: message
        }
      );

      const reply = response.data.reply;

      if (reply) {
        await sock.sendMessage(msg.key.remoteJid, { text: reply });
      }

    } catch (err) {
      console.log("API error:", err.message);
    }

  });

}

startBot();