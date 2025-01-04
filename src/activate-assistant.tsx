import { useState } from "react";
import { ActionPanel, Action, Detail, getPreferenceValues } from "@raycast/api";
import WebSocket from "ws";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("Ready to start conversation");
  const preferences = getPreferenceValues<Preferences.ActivateAssistant>();

  const initializeWebSocket = async () => {
    try {
      setIsLoading(true);
      setStatus("Connecting to Realtime API...");

      const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
      const ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${preferences.openaiApiKey}`,
          "OpenAI-Beta": "realtime=v1",
        },
      });

      ws.on("open", () => {
        console.log("Connected to server.");
        setStatus("Connected to Realtime API");

        // Send a message to start the conversation
        const event = {
          type: "response.create",
          response: {
            modalities: ["text"],
            instructions: "Hello! How can I assist you today?",
          },
        };
        ws.send(JSON.stringify(event));
      });

      ws.on("message", (message) => {
        const serverEvent = JSON.parse(message.toString());
        console.log("Received:", serverEvent);
        // Update status or handle the response as needed
        setStatus(`Response: ${serverEvent.response?.text || "No response text"}`);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        setStatus(`Error: ${error.message}`);
      });
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setStatus(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Detail
      markdown={status}
      actions={
        <ActionPanel>
          <Action title={isLoading ? "Connecting…" : "Start Conversation"} onAction={initializeWebSocket} />
        </ActionPanel>
      }
    />
  );
}
