const { createClient } = require('@supabase/supabase-js');
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://eepxrnqcefpvzxqkpjaw.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzIzNDgsImV4cCI6MjA2NDIwODM0OH0.zTsgRk2c8zdO0SnQBI9CicH_NodH_C9duSdbwojAKBQ'
);

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// In-memory store for campaign creation sessions
const campaignSessions = {};

const campaignFields = [
  { key: 'campaign_name', prompt: 'What is the name of your campaign?' },
  { key: 'description', prompt: 'Please provide a short description for your campaign.' },
  { key: 'platforms', prompt: 'Which platforms do you want to target? (Reply with comma-separated values, e.g. Instagram, TikTok, YouTube)' },
  { key: 'preferred_languages', prompt: 'Preferred languages for influencers? (e.g. English, Hindi, etc.)' },
  { key: 'budget', prompt: 'What is your total budget for this campaign? (in INR)' },
  { key: 'start_date', prompt: 'What is the start date? (YYYY-MM-DD)' },
  { key: 'end_date', prompt: 'What is the end date? (YYYY-MM-DD)' },
  { key: 'voice_enabled', prompt: 'Do you want voice-enabled content? (yes/no)' },
];

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

async function fetchMatchedInfluencers(query) {
  const url =
    "https://influencerflow-ai-services-964513157102.asia-south1.run.app/influencers/query";
  const response = await axios.post(url, { query, k: 10 });
  return response.data && response.data.influencers
    ? response.data.influencers
    : [];
}

function getNextCampaignField(session) {
  for (const field of campaignFields) {
    if (!(field.key in session.data)) {
      return field;
    }
  }
  return null;
}

function parseFieldValue(key, value) {
  if (key === "platforms") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (key === "voice_enabled") {
    return /^(yes|y|true|1)$/i.test(value);
  }
  return value;
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
      const entry = req.body.entry && req.body.entry[0];
      const changes = entry && entry.changes && entry.changes[0];
      const value = changes && changes.value;
      const messages = value && value.messages;
      const interactive = messages && messages[0] && messages[0].interactive;
      const phoneNumber = messages && messages[0] && messages[0].from;
      const text =
        messages &&
        messages[0] &&
        messages[0].text &&
        messages[0].text.body &&
        messages[0].text.body.trim();

      // If user is in the middle of campaign creation, continue the flow
      if (phoneNumber && campaignSessions[phoneNumber]) {
        const session = campaignSessions[phoneNumber];
        const currentField = getNextCampaignField(session);
        if (currentField) {
          // Save the user's answer
          session.data[currentField.key] = parseFieldValue(
            currentField.key,
            text
          );
          const nextField = getNextCampaignField(session);
          if (nextField) {
            await sendWhatsappTextMessage(phoneNumber, nextField.prompt);
            return res.status(200).send("Awaiting next field");
          } else {
            // All fields collected, fetch influencers
            await sendWhatsappTextMessage(
              phoneNumber,
              "Thanks! Finding matching influencers for your campaign..."
            );
            const influencers = await fetchMatchedInfluencers(session.data);
            if (influencers.length === 0) {
              await sendWhatsappTextMessage(
                phoneNumber,
                "No matching influencers found. Try adjusting your campaign criteria."
              );
            } else {
              let msg = "Here are some matching influencers:\n";
              influencers.forEach((inf, idx) => {
                msg += `\n${idx + 1}. ${inf.username} (${
                  inf.followers
                } followers)\n${inf.bio ? inf.bio + "\n" : ""}${
                  inf.link ? inf.link : ""
                }`;
              });
              await sendWhatsappTextMessage(phoneNumber, msg);
            }
            delete campaignSessions[phoneNumber];
            return res.status(200).send("Influencer list sent");
          }
        }
      }

      // Handle interactive list selection (e.g. create_campaign)
      if (interactive && interactive.type === "list_reply") {
        const selectedId = interactive.list_reply && interactive.list_reply.id;
        if (selectedId === "create_campaign") {
          // Start campaign creation session
          campaignSessions[phoneNumber] = { data: {} };
          await sendWhatsappTextMessage(phoneNumber, campaignFields[0].prompt);
          return res.status(200).send("Started campaign creation");
        }
        // ... handle other actions in the future ...
      }

      // Restore onboarding/registered user logic for 'hi' text
      if (text && text.toLowerCase() === "hi") {
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
      }

      // Fallback
      return res.status(200).send("No action taken");
    } catch (error) {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  }
};
