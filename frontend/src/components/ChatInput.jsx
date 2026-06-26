function ChatInput({ input, setInput, sendMessage }) {
  function handleKeyDown(event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  }

  return (
    <div className="chat-input">
      <input
        type="text"
        placeholder="Exemple : Je veux un autocar de Marseille à Nice..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button onClick={sendMessage}>
        Envoyer
      </button>
    </div>
  );
}

export default ChatInput;