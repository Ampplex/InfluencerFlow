import { useEffect, useRef, useState} from "react";
import supabase from '../utils/supabase';

const ElevenLabsWidget = ({email, campaign_id}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [brand_description, setBrandDescription] = useState<any>("");
  const [influencerData, setInfluencerData] = useState<any>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        if (!campaign_id) return;
        const { data, error } = await supabase
          .from('campaign')
          .select('*')
          .eq('id', campaign_id)
          .single();
        if (error) {
          console.error('Error fetching campaign:', error);
        } else {
          console.log(data);
          if (data) {
            setCampaignData(data);
            // setDuration('2_weeks'); // You may map campaign duration fields if available
          }
        }

      } catch (error) {
        console.error('Error fetching campaign:', error);
        // Display Error Message
      }
    };
    fetchCampaign();
  }, [campaign_id]);

  useEffect(() => {
    const fetchBrand = async () => {
      console.log("we have", campaignData.brand_name)
        // Fetch brands table
        const {data, error} = await supabase
        .from("brands")
        .select("brand_description")
        .eq("brand_name", campaignData.brand_name);
        if (error) {
          console.error(error)
        } else if (data) {
          setBrandDescription(data);
        }
    }
    if (!campaignData) {
      return;
    }
    fetchBrand();
  }, [campaign_id, campaignData])

  useEffect(() => {
    // Fetch influencer name from email
    const fetchInfluencerName = async () => {
      const {data, error} = await supabase
      .from("influencers")
      .select("*")
      .eq("influencer_email", email)
      .single();

      if (error) {
        console.error(error)
      } else if (data) {
        setInfluencerData(data);
      }
    }

    fetchInfluencerName();
  }, [email])

  useEffect(() => {
    if (!campaignData) return;
    if (!brand_description) return;
    if (!influencerData) return;

    console.log("Brand description: ",brand_description[0].brand_description);
    console.log("Influencer name ", influencerData.influencer_username);

    const scriptId = "elevenlabs-widget-script";

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
      script.async = true;
      script.type = "text/javascript";
      script.id = scriptId;
      document.body.appendChild(script);
    }

    const interval = setInterval(() => {
      if ((window as any).customElements?.get("elevenlabs-convai")) {
        const widget = document.createElement("elevenlabs-convai");

        widget.setAttribute("agent-id", "agent_01jy45qdw4ex3vj5g4x8f1854n");
        widget.setAttribute(
          "dynamic-variables",
          JSON.stringify({
            brand_name: campaignData.brand_name,
            influencer_name: influencerData.influencer_username,
            campaign_description: campaignData.description,
            campaign: campaignData.campaign_name,
            brand_description: brand_description[0].brand_description,
            budget: campaignData.budget,
            campaign_id: campaign_id,
            email: email
          })
        );

        if (containerRef.current && containerRef.current.children.length === 0) {
          containerRef.current.appendChild(widget);
        }

        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [campaignData, campaign_id, email]);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">ElevenLabs Conversational AI</h1>
        <p className="text-sm opacity-90">
          AI-powered conversation interface
        </p>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  );
};

export default ElevenLabsWidget;
