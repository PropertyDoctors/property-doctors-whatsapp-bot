const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu"
    ]
  }
});

client.on("qr", (qr) => {
  console.log("Scan the QR code below with WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp Bot Ready");
});

client.on("message", async (msg) => {

  if (msg.type !== "chat") return;
  try {
    const phone = msg.from.replace("@c.us", "");
    const message = msg.body;

    console.log("Incoming message:", phone, message);

    const response = await axios.post(
      "https://property-doctors-crm.vercel.app/api/whatsapp/incoming",
      {
        phone: phone,
        message: message,
      }
    );

    const reply = response.data.reply;

    if (reply) {
      await client.sendMessage(msg.from, reply);
    }

  } catch (error) {
    console.error("Bot error:", error.message);
  }
});

client.initialize();