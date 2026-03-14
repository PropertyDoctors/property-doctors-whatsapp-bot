const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode-terminal")
const axios = require("axios")

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState("auth")

const sock = makeWASocket({
auth: state
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
        console.log("Scan this QR with WhatsApp:");
        qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
        console.log("✅ WhatsApp Bot Ready");
    }

    if (connection === "close") {

    const shouldReconnect =
        (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut

    console.log("connection closed")

    if (shouldReconnect) {
        console.log("reconnecting...")
        startBot()
    }

}

});

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]

if (!msg.message || msg.key.fromMe) return

const phone = msg.key.remoteJid.replace("@s.whatsapp.net", "")
const message = msg.message.conversation || ""

console.log("Incoming:", phone, message)

try {

const response = await axios.post(
"https://property-doctors-crm.vercel.app/api/whatsapp/incoming",
{
phone,
message
}
)

const reply = response.data.reply

if (reply) {
await sock.sendMessage(msg.key.remoteJid, { text: reply })
}

} catch (error) {

console.log("API error:", error.message)

}

})

}

startBot()

/* KEEP RENDER SERVICE ALIVE */

const express = require("express")
const app = express()

app.get("/", (req,res)=>{
res.send("WhatsApp bot running")
})

app.listen(process.env.PORT || 3000, ()=>{
console.log("Server running")
})