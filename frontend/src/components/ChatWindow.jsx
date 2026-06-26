import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

function ChatWindow({ messages, isTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="messages">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {isTyping && (
        <div className="message-row bot-row">
          <div className="avatar">🤖</div>

          <div className="typing-bubble">
            <span>NeoTravel écrit</span>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default ChatWindow;