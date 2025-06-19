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
  const response = await axios.post(url, {
    query: JSON.stringify(query),
    k: 10,
  });
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

function isValidFieldValue(key, value) {
  if (!value) return false;
  if (key === "budget") return !isNaN(Number(value));
  if (key === "start_date" || key === "end_date")
    return /^\d{4}-\d{1,2}-\d{1,2}$/.test(value);
  if (key === "voice_enabled")
    return /^(yes|no|y|n|true|false|1|0)$/i.test(value);
  if (key === "platforms") return value.split(",").length > 0;
  return true;
}

async function sendInfluencerSelectionList(to, influencers) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WhatsApp phone number ID or access token not set in environment variables"
    );
  }
  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  // Section-based pagination: up to 10 sections, each with up to 10 rows (max 100 influencers)
  const maxInfluencers = 100;
  const maxRowsPerSection = 10;
  const maxSections = 10;
  const limitedInfluencers = influencers.slice(0, maxInfluencers);
  const sections = [];
  for (
    let i = 0;
    i < limitedInfluencers.length && sections.length < maxSections;
    i += maxRowsPerSection
  ) {
    const page = limitedInfluencers.slice(i, i + maxRowsPerSection);
    sections.push({
      title: `Page ${Math.floor(i / maxRowsPerSection) + 1}`,
      rows: page.map((inf) => ({
        id: `influencer_${inf.id}`,
        title: inf.username,
        description: `${inf.followers} followers${
          inf.bio ? " - " + inf.bio : ""
        }`,
      })),
    });
  }

  const data = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Select an influencer:" },
      body: { text: "Choose one influencer to proceed." },
      footer: {
        text: "You can only select one at a time. Showing up to 100 results.",
      },
      action: {
        button: "Select influencer",
        sections,
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
      res.status(200).send(challenge);
    } else {
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
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(200).send("No messages");
      }
      const message = messages[0];
      const phoneNumber = message.from;
      const text =
        message.text && message.text.body && message.text.body.trim();
      const interactive = message.interactive;

      // If user is in the middle of campaign creation, continue the flow
      if (phoneNumber && campaignSessions[phoneNumber]) {
        const session = campaignSessions[phoneNumber];
        if (session.awaitingField) {
          const currentField = campaignFields.find(
            (f) => f.key === session.awaitingField
          );
          if (!currentField) {
            delete campaignSessions[phoneNumber];
            await sendWhatsappTextMessage(
              phoneNumber,
              "Sorry, something went wrong. Please start again."
            );
            return res.status(200).send("Session error");
          }
          if (!isValidFieldValue(currentField.key, text)) {
            await sendWhatsappTextMessage(
              phoneNumber,
              `Invalid input. ${currentField.prompt}`
            );
            return res.status(200).send("Invalid input, re-asked");
          }
          session.data[currentField.key] = parseFieldValue(
            currentField.key,
            text
          );
          const nextField = getNextCampaignField(session);
          if (nextField) {
            session.awaitingField = nextField.key;
            await sendWhatsappTextMessage(phoneNumber, nextField.prompt);
            return res.status(200).send("Awaiting next field");
          } else {
            // All fields collected, fetch influencers
            await sendWhatsappTextMessage(
              phoneNumber,
              "Thanks! Finding matching influencers for your campaign..."
            );
            console.log(
              "[INFLUENCER_API] Request payload:",
              JSON.stringify(session.data, null, 2)
            );
            try {
              const influencers = await fetchMatchedInfluencers(session.data);
              console.log(
                "[INFLUENCER_API] Response:",
                JSON.stringify(influencers, null, 2)
              );
              if (!Array.isArray(influencers)) {
                await sendWhatsappTextMessage(
                  phoneNumber,
                  "Sorry, there was an error fetching influencers. Please try again later."
                );
              } else if (influencers.length === 0) {
                await sendWhatsappTextMessage(
                  phoneNumber,
                  "No matching influencers found. Try adjusting your campaign criteria."
                );
              } else {
                // Store influencers in session for selection
                session.influencers = influencers;
                session.awaitingField = null;
                await sendInfluencerSelectionList(phoneNumber, influencers);
                session.awaitingInfluencerSelection = true;
              }
            } catch (err) {
              if (err.response) {
                console.error(
                  "[INFLUENCER_API] Error response:",
                  JSON.stringify(err.response.data, null, 2)
                );
              } else {
                console.error("[INFLUENCER_API] Error:", err.message);
              }
              await sendWhatsappTextMessage(
                phoneNumber,
                "Sorry, there was an error fetching influencers. Please try again later."
              );
            }
            return res.status(200).send("Influencer list sent");
          }
        } else if (
          session.awaitingInfluencerSelection &&
          interactive &&
          interactive.type === "list_reply"
        ) {
          // Handle influencer selection
          const selectedId =
            interactive.list_reply && interactive.list_reply.id;
          if (selectedId && selectedId.startsWith("influencer_")) {
            const influencerId = selectedId.replace("influencer_", "");
            const selectedInfluencer = (session.influencers || []).find(
              (inf) => String(inf.id) === influencerId
            );
            if (selectedInfluencer) {
              session.selectedInfluencer = selectedInfluencer;
              await sendWhatsappTextMessage(
                phoneNumber,
                `You selected: ${selectedInfluencer.username} (${selectedInfluencer.followers} followers)`
              );
              // Here you can proceed to next steps (e.g., outreach, confirmation, etc.)
              delete campaignSessions[phoneNumber];
              return res.status(200).send("Influencer selected");
            } else {
              await sendWhatsappTextMessage(
                phoneNumber,
                "Invalid selection. Please try again."
              );
              await sendInfluencerSelectionList(
                phoneNumber,
                session.influencers
              );
              return res.status(200).send("Invalid influencer selection");
            }
          }
        }
      }

      // Handle interactive list selection (e.g. create_campaign)
      if (interactive && interactive.type === "list_reply") {
        const selectedId = interactive.list_reply && interactive.list_reply.id;
        if (selectedId === "create_campaign") {
          campaignSessions[phoneNumber] = {
            data: {},
            awaitingField: campaignFields[0].key,
          };
          await sendWhatsappTextMessage(phoneNumber, campaignFields[0].prompt);
          return res.status(200).send("Started campaign creation");
        }
      }

      // Only proceed with 'hi' logic if text is present
      if (text && text.toLowerCase() === "hi") {
        const { data, error } = await supabase
          .from("brands")
          .select("id, brand_name")
          .eq("contact_num", phoneNumber)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          await sendWhatsappListMessage(phoneNumber, data.brand_name);
          return res.status(200).json({ reply: "Welcome back!" });
        } else {
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
