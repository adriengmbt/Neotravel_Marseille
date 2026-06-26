import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

function ChatWindow({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="messages">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

export default ChatWindow;