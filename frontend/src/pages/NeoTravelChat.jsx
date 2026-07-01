import React, { useState, useRef, useEffect } from "react";

// =====================================================================
//  NeoTravel — Page web complète (landing + assistant de devis)
//  Charte du dossier de cadrage. Aucune dépendance hors React.
//  Branché sur l'agent n8n (Chat Trigger).
// =====================================================================

const WEBHOOK_URL =
  "https://flows.onatera.dev/webhook/a80f3deb-ab87-4c0a-8f58-817da042d298/chat";

/* ----------------------------- Chat ----------------------------- */
export function NeoTravelChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Bonjour 👋 Je suis l'assistant NeoTravel. Indiquez-moi votre départ, votre destination, la date et le nombre de passagers, et je vous prépare un devis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef("web-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendMessage", chatInput: text, sessionId: sessionId.current }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      let reply;
      try {
        const data = await res.json();
        reply =
          data.output ?? data.text ?? data.message ??
          (Array.isArray(data) ? data[0]?.output : null) ??
          (typeof data === "string" ? data : JSON.stringify(data));
      } catch {
        reply = await res.text();
      }
      setMessages((m) => [...m, { role: "assistant", text: reply || "(réponse vide)" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", error: true, text: "La connexion à l'assistant a échoué. Vérifiez que le workflow n8n est actif, puis réessayez." }]);
    } finally {
      setLoading(false);
    }
  }
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="nt-chat">
      <div className="nt-chat-head">
        <div className="nt-eyebrow nt-mint">NEOTRAVEL · ASSISTANT DEVIS</div>
        <div className="nt-chat-title">Obtenez votre devis maintenant</div>
      </div>
      <div className="nt-chat-msgs" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={"nt-row " + (m.role === "user" ? "nt-right" : "nt-left")}>
            {m.role === "assistant" && <div className="nt-ava">N</div>}
            <div className={"nt-bubble " + (m.role === "user" ? "nt-b-user" : "nt-b-bot") + (m.error ? " nt-b-err" : "")}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="nt-row nt-left">
            <div className="nt-ava">N</div>
            <div className="nt-bubble nt-b-bot"><span className="nt-dot" /><span className="nt-dot d2" /><span className="nt-dot d3" /></div>
          </div>
        )}
      </div>
      <div className="nt-inputbar">
        <input className="nt-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder="Écrivez votre demande…" disabled={loading} />
        <button className="nt-send" onClick={send} disabled={loading || !input.trim()}>Envoyer</button>
      </div>
    </div>
  );
}

/* --------------------------- Page ------------------------------- */
export default function App() {
  return (
    <div className="nt-app">
      <style>{CSS}</style>

      {/* NAV */}
      <header className="nt-nav">
        <div className="nt-brand"><span className="nt-brand-dot" />NeoTravel</div>
        <nav className="nt-links">
          <a href="#how">Comment ça marche</a>
          <a href="#chat">Devis en ligne</a>
        </nav>
        <a href="#chat" className="nt-cta">Demander un devis</a>
      </header>

      {/* HERO */}
      <section className="nt-hero">
        <div className="nt-hero-grid">
          <div className="nt-hero-copy">
            <div className="nt-eyebrow nt-mint">TRANSPORT D'AUTOCAR DE GROUPE</div>
            <h1 className="nt-h1">Votre autocar de groupe,<br /><span className="nt-accent">devis immédiat.</span></h1>
            <p className="nt-lead">
              Sorties scolaires, séminaires, associations, collectivités. Décrivez votre trajet à notre assistant : il calcule un devis clair et détaillé, sans attente.
            </p>
            <div className="nt-stats">
              <div className="nt-stat"><div className="nt-stat-n">2 min</div><div className="nt-stat-l">pour recevoir un devis</div></div>
              <div className="nt-stat"><div className="nt-stat-n">≤ 85</div><div className="nt-stat-l">passagers par autocar</div></div>
              <div className="nt-stat"><div className="nt-stat-n">24 h</div><div className="nt-stat-l">réponse d'un conseiller</div></div>
            </div>
          </div>
          <div id="chat" className="nt-hero-chat"><NeoTravelChat /></div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="how" className="nt-how">
        <div className="nt-eyebrow nt-green" style={{ textAlign: "center" }}>COMMENT ÇA MARCHE</div>
        <h2 className="nt-h2">Trois étapes, sans engagement</h2>
        <div className="nt-steps">
          {[
            ["01", "Décrivez", "Votre trajet, vos dates et le nombre de passagers, en langage naturel."],
            ["02", "Recevez", "Un devis détaillé et transparent, calculé automatiquement et auditable."],
            ["03", "Confirmez", "Un conseiller finalise votre réservation pour les cas particuliers."],
          ].map(([n, t, d]) => (
            <div key={n} className="nt-step">
              <div className="nt-step-n">{n}</div>
              <div className="nt-step-t">{t}</div>
              <div className="nt-step-d">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="nt-footer">
        <div className="nt-brand nt-brand-light"><span className="nt-brand-dot" />NeoTravel</div>
        <div className="nt-foot-txt">Intermédiaire en transport d'autocar de groupe — devis automatisé.</div>
        <div className="nt-foot-mini">Prototype · Epitech 2026</div>
      </footer>
    </div>
  );
}

/* ----------------------------- CSS ------------------------------ */
const CSS = `
:root{
  --navy:#0B1220; --navy2:#12182B; --green:#2F7C62; --mint:#5FC9A0;
  --mintbg:#E7F5EF; --slate:#44506B; --light:#AEB9CF; --paper:#fff; --bg:#F4F6F9;
  --mono:'Consolas','SF Mono','JetBrains Mono',ui-monospace,monospace;
  --sans:Arial,Helvetica,sans-serif;
}
.nt-app{font-family:var(--sans);color:#1a2233;background:var(--paper);min-height:100vh}
.nt-app *{box-sizing:border-box}
.nt-eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:2px;font-weight:700}
.nt-mint{color:var(--mint)} .nt-green{color:var(--green)}
.nt-accent{color:var(--mint)}

/* NAV */
.nt-nav{display:flex;align-items:center;gap:24px;padding:18px 40px;background:var(--navy)}
.nt-brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;color:#fff}
.nt-brand-dot{width:12px;height:12px;border-radius:50%;background:var(--mint);box-shadow:0 0 0 4px rgba(95,201,160,.2)}
.nt-links{display:flex;gap:22px;margin-left:auto}
.nt-links a{color:var(--light);text-decoration:none;font-size:14px}
.nt-links a:hover{color:#fff}
.nt-cta{background:var(--green);color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:700;font-size:14px}
.nt-cta:hover{background:#276a54}

/* HERO */
.nt-hero{background:radial-gradient(900px 500px at 15% -10%,var(--navy2),var(--navy));padding:64px 40px 80px}
.nt-hero-grid{max-width:1140px;margin:0 auto;display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
.nt-hero-copy .nt-eyebrow{border-bottom:2px solid var(--green);display:inline-block;padding-bottom:8px;margin-bottom:20px}
.nt-h1{color:#fff;font-size:52px;line-height:1.08;font-weight:800;margin:0 0 20px}
.nt-lead{color:var(--light);font-size:17px;line-height:1.6;max-width:520px;margin:0 0 32px}
.nt-stats{display:flex;gap:36px;flex-wrap:wrap}
.nt-stat-n{font-family:var(--mono);color:var(--mint);font-size:28px;font-weight:700}
.nt-stat-l{color:var(--light);font-size:13px;margin-top:2px}
.nt-hero-chat{display:flex;justify-content:center}

/* CHAT */
.nt-chat{width:100%;max-width:420px;height:560px;display:flex;flex-direction:column;background:var(--paper);border-radius:16px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.08)}
.nt-chat-head{background:var(--navy);padding:16px 20px;border-bottom:3px solid var(--green)}
.nt-chat-title{color:#fff;font-size:17px;font-weight:700;margin-top:6px}
.nt-chat-msgs{flex:1;overflow-y:auto;padding:16px;background:var(--bg);display:flex;flex-direction:column;gap:12px}
.nt-row{display:flex;align-items:flex-end;gap:8px}
.nt-row.nt-right{justify-content:flex-end}
.nt-ava{width:28px;height:28px;border-radius:8px;background:var(--navy);color:var(--mint);font-family:var(--mono);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nt-bubble{max-width:78%;padding:10px 14px;border-radius:14px;font-size:14.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
.nt-b-user{background:var(--navy);color:#fff;border-bottom-right-radius:4px}
.nt-b-bot{background:var(--mintbg);color:#1a2233;border-bottom-left-radius:4px}
.nt-b-err{color:#B23B3B}
.nt-inputbar{display:flex;gap:8px;padding:12px;border-top:1px solid var(--mintbg)}
.nt-input{flex:1;border:1px solid #d8e0e6;border-radius:10px;padding:11px 14px;font-size:14.5px;font-family:var(--sans);outline:none;color:var(--navy)}
.nt-input:focus{border-color:var(--green)}
.nt-send{background:var(--green);color:#fff;border:none;border-radius:10px;padding:0 18px;font-size:14px;font-weight:700;cursor:pointer}
.nt-send:disabled{opacity:.5;cursor:default}
.nt-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);margin:0 2px;animation:ntb 1.2s infinite}
.nt-dot.d2{animation-delay:.2s}.nt-dot.d3{animation-delay:.4s}
@keyframes ntb{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}

/* HOW */
.nt-how{max-width:1000px;margin:0 auto;padding:80px 40px}
.nt-h2{text-align:center;font-size:32px;font-weight:800;color:var(--navy);margin:10px 0 44px}
.nt-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.nt-step{background:var(--paper);border:1px solid #e7edf1;border-radius:14px;padding:26px;border-top:3px solid var(--green)}
.nt-step-n{font-family:var(--mono);color:var(--green);font-size:22px;font-weight:700}
.nt-step-t{font-size:19px;font-weight:700;color:var(--navy);margin:10px 0 8px}
.nt-step-d{color:var(--slate);font-size:14.5px;line-height:1.6}

/* FOOTER */
.nt-footer{background:var(--navy);padding:40px;text-align:center}
.nt-brand-light{justify-content:center;font-size:18px}
.nt-foot-txt{color:var(--light);font-size:14px;margin-top:10px}
.nt-foot-mini{font-family:var(--mono);color:var(--slate);font-size:12px;letter-spacing:1px;margin-top:14px}

/* RESPONSIVE */
@media(max-width:860px){
  .nt-hero-grid{grid-template-columns:1fr;gap:36px}
  .nt-h1{font-size:38px}
  .nt-steps{grid-template-columns:1fr}
  .nt-links{display:none}
  .nt-nav{padding:16px 20px}.nt-hero{padding:40px 20px 56px}.nt-how{padding:56px 20px}
  .nt-hero-chat{order:2}
}
`;