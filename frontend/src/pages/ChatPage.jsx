import { useState } from "react";
import Header from "../components/Header";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Bonjour 👋 Je suis l’assistant NeoTravel. Décrivez votre besoin de transport et je vous aiderai à préparer votre devis.",
      time: getTime(),
    },
  ]);

  const [input, setInput] = useState("");

  function sendMessage() {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input,
      time: getTime(),
    };

    const botMessage = {
      role: "bot",
      text: "Merci pour votre demande. Pouvez-vous préciser la date du trajet, la ville de départ, la destination et le nombre de passagers ?",
      time: getTime(),
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      botMessage,
    ]);

    setInput("");
  }

  return (
    <div className="chat-page">
      <Header />

      <main className="chat-container">
        <ChatWindow messages={messages} />

        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
        />
      </main>
    </div>
  );
}

export default ChatPage;