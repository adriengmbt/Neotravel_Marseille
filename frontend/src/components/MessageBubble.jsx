function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "user-row" : "bot-row"}`}>
      <div className="avatar">
        {isUser ? "👤" : "🤖"}
      </div>

      <div>
        <div className={`message-bubble ${isUser ? "user-message" : "bot-message"}`}>
          {message.text}
        </div>

        <span className={`message-time ${isUser ? "time-user" : "time-bot"}`}>
          {message.time}
        </span>
      </div>
    </div>
  );
}

export default MessageBubble;