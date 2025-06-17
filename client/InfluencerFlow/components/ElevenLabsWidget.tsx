import { useEffect, useRef } from "react";

const ElevenLabsWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

        widget.setAttribute("agent-id", "agent_01jxykr1xhfzarw8fg68nxtfs1");
        widget.setAttribute(
          "dynamic-variables",
          JSON.stringify({
            brand_name: "Meta",
            influencer_name: "Ankesh Kumar",
            campaign_description:
              "Looking for influencer to post 3–4 images and thumbnails about the campaign",
            campaign: "MetaThon",
            brand_description: "Meta is a leading social media tech giant",
            budget: "200",
          })
        );

        if (containerRef.current && containerRef.current.children.length === 0) {
          containerRef.current.appendChild(widget);
        }

        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
