const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode-terminal")
const axios = require("axios")
const express = require("express")

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState("auth_info")

const sock = makeWASocket({
auth: state,
browser: ["Ubuntu", "Chrome", "20.0.04"],
syncFullHistory: false,
markOnlineOnConnect: true
})

sock.ev.on("creds.update", saveCreds)

/* CONNECTION EVENTS */

sock.ev.on("connection.update", (update) => {

console.log("Connection update:", update)

const { connection, lastDisconnect, qr } = update

if (qr) {
console.log("================================================")
console.log("SCAN THIS QR WITH WHATSAPP BUSINESS")
console.log("================================================")
qrcode.generate(qr, { small: true })
}

if (connection === "open") {
console.log("✅ WhatsApp Bot Ready")
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

})

/* MESSAGE EVENTS */

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

const app = express()

app.get("/", (req,res)=>{
res.send("WhatsApp bot running")
})

app.listen(process.env.PORT || 3000, ()=>{
console.log("Server running")
})