const { createClient } = require('@supabase/supabase-js');
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://eepxrnqcefpvzxqkpjaw.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzIzNDgsImV4cCI6MjA2NDIwODM0OH0.zTsgRk2c8zdO0SnQBI9CicH_NodH_C9duSdbwojAKBQ'
);

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function sendWhatsappTemplateMessage(to) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WhatsApp phone number ID or access token not set in environment variables"
    );
  }
  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" },
    },
  };
  await axios.post(url, data, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

async function sendWhatsappTextMessage(to, text) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WhatsApp phone number ID or access token not set in environment variables"
    );
  }
  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };
  await axios.post(url, data, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

module.exports = class UserController {
  // GET for webhook verification
  async verifyWebhook(req, res) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verify hit", {
        mode,
        token,
        challenge,
        VERIFY_TOKEN,
      });
      res.status(200).send(challenge);
    } else {
      console.log("Webhook verify failed", {
        mode,
        token,
        challenge,
        VERIFY_TOKEN,
      });
      res.status(403).send("Verification failed");
    }
  }

  // POST for WhatsApp webhook
  async handleWebhook(req, res) {
    try {
      console.log("Webhook hit", req.body);
      // Meta's Cloud API payload structure
      const entry = req.body.entry && req.body.entry[0];
      const changes = entry && entry.changes && entry.changes[0];
      const value = changes && changes.value;
      const messages = value && value.messages;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(200).send("No messages");
      }
      const message = messages[0];
      const phoneNumber = message.from; // WhatsApp phone number (string)
      const text =
        message.text && message.text.body && message.text.body.trim();
      if (!phoneNumber || !text) {
        return res.status(200).send("No phone or text");
      }
      if (text.toLowerCase() === "hi") {
        // Check brands table for contact_num
        const { data, error } = await supabase
          .from("brands")
          .select("id")
          .eq("contact_num", phoneNumber)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          // Registered brand: send custom text message
          await sendWhatsappTextMessage(
            phoneNumber,
            "Welcome back, you are a registered brand!"
          );
          return res.status(200).json({ reply: "Welcome back!" });
        } else {
          // Not registered: send template message
          await sendWhatsappTemplateMessage(phoneNumber);
          return res
            .status(200)
            .json({ reply: "You are not registered with us. Please sign up." });
        }
      } else {
        // Ignore other messages for now
        return res.status(200).send("Ignored");
      }
    } catch (error) {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  }
};
