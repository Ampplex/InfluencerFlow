const { createClient } = require('@supabase/supabase-js');
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://eepxrnqcefpvzxqkpjaw.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzIzNDgsImV4cCI6MjA2NDIwODM0OH0.zTsgRk2c8zdO0SnQBI9CicH_NodH_C9duSdbwojAKBQ'
);

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

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

async function sendWhatsappListMessage(to, name) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WhatsApp phone number ID or access token not set in environment variables"
    );
  }
  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: `Hello ${name || "there"}!`,
      },
      body: {
        text: "What do you want to do today?",
      },
      footer: {
        text: "Select an option below:",
      },
      action: {
        button: "Select option",
        sections: [
          {
            title: "Options",
            rows: [
              {
                id: "create_campaign",
                title: "Create campaign",
                description: "Start a new influencer campaign",
              },
              {
                id: "get_updates",
                title: "Get real time updates",
                description: "Get updates about your campaigns",
              },
              {
                id: "notifications",
                title: "Notifications",
                description: "View your notifications",
              },
              {
                id: "other",
                title: "Other",
                description: "More options coming soon",
              },
            ],
          },
        ],
      },
    },
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
          .select("id, brand_name")
          .eq("contact_num", phoneNumber)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          // Registered brand: send interactive list message
          await sendWhatsappListMessage(phoneNumber, data.brand_name);
          return res.status(200).json({ reply: "Welcome back!" });
        } else {
          // Not registered: send onboarding text message
          const onboardingMsg =
            "influencerflow.in is now LIVE.\n" +
            "And for the next 48 hours, the doors are open.\n" +
            "For years, influencer marketing has been a game of guesswork, endless spreadsheets, and wasted budgets. While you've been busy managing the chaos, your competitors have been looking for an edge.\n" +
            "That edge is here.\n" +
            "We are giving the first 100 brands that sign up for Early Access the power to automate their workflow, discover authentic creators, and measure what actually matters before anyone else.\n" +
            "After the first 100 spots are claimed, access will be closed.\n" +
            "The next move is yours. Don't get left behind.\n" +
            "Claim one of the 100 spots now: https://influencerflow.in";
          await sendWhatsappTextMessage(phoneNumber, onboardingMsg);
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
