function Header({ resetConversation }) {
  return (
    <header className="header">

      <div className="header-top">
        <div>
          <div className="logo">🚌</div>

          <h1>NeoTravel</h1>

          <p>
            Assistant IA de réservation de transport de groupe
          </p>
        </div>

        <button
          className="new-chat-btn"
          onClick={resetConversation}
        >
          + Nouvelle conversation
        </button>

      </div>

    </header>
  );
}

export default Header;