import { useState } from "react";
import Header from "../components/Header";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const welcomeMessage = {
  role: "bot",
  text: "Bonjour 👋 Je suis NeoTravel, votre assistant IA de réservation de transport de groupe. Décrivez votre besoin : ville de départ, destination, date, nombre de passagers…",
  time: getTime(),
};

function ChatPage() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  function resetConversation() {
    setMessages([
      {
        ...welcomeMessage,
        time: getTime(),
      },
    ]);
    setInput("");
    setIsTyping(false);
  }

  function sendMessage() {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      role: "user",
      text: input,
      time: getTime(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulation temporaire.
    // Ton collègue remplacera cette partie par l'appel au webhook n8n.
    setTimeout(() => {
      const botMessage = {
        role: "bot",
        text: "Merci pour votre demande. Pour préparer le devis, pouvez-vous préciser la date du trajet, la ville de départ, la destination et le nombre de passagers ?",
        time: getTime(),
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setIsTyping(false);
    }, 900);
  }

  return (
    <div className="chat-page">
      <Header resetConversation={resetConversation} />

      <main className="chat-container">
        <ChatWindow messages={messages} isTyping={isTyping} />

        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isTyping={isTyping}
        />
      </main>
    </div>
  );
}

export default ChatPage;