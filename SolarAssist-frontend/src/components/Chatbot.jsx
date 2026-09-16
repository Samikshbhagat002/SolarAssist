import { useState, useRef } from "react";

// ============================================================
// CHATBOT WIDGET — React version
// Place this file at src/components/Chatbot.jsx (or similar),
// then import it ONCE near the top level of your app so it
// shows on every page. In App.jsx: import Chatbot from
// "./components/Chatbot", then render <Chatbot /> somewhere
// inside your top-level JSX (see App.jsx for the real example).
//
// TWO MODES:
// - "demo"  -> works right now with zero backend, canned answers
// - "api"   -> POSTs to your own backend, which calls the AI model
// Switch CONFIG.MODE below.
// ============================================================

const CONFIG = {
  MODE: "api",                      // "demo" or "api"
  API_ENDPOINT: import.meta.env.VITE_CHATBOT_URL,
};

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "mr", label: "मर" },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState(null); // { base64, mimeType, name, dataUrl }
  const [typing, setTyping] = useState(false);
  const [lang, setLang] = useState("en"); // NEW: selected reply language
  const fileInputRef = useRef(null);
  const historyRef = useRef([]); // conversation history sent to the backend

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next && messages.length === 0) {
        setMessages([
          {
            sender: "bot",
            text:
              "Hi! I'm SolarGuide 🌞 — ask me anything about SolarAssist in English, हिंदी, or मराठी. " +
              "You can also attach a photo of your electricity bill, your rooftop, or a solar panel " +
              "(I'll check it for visible faults like dust, cracks, or damage), or just chat casually!",
          },
        ]);
      }
      return next;
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      setPendingImage({ base64, mimeType: file.type, name: file.name, dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setPendingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function sendMessage() {
    const text = input.trim();
    const image = pendingImage;
    if (!text && !image) return;

    setMessages((prev) => [...prev, { sender: "user", text, imageUrl: image?.dataUrl }]);
    historyRef.current.push({
      role: "user",
      content: text || (image ? "(sent an image)" : ""),
      image: image || undefined,
    });

    setInput("");
    setPendingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTyping(true);

    let reply;
    try {
      reply = CONFIG.MODE === "api" ? await getApiReply(text, image, lang) : await getDemoReply(text, image, lang);
    } catch (err) {
      reply = "Sorry, something went wrong reaching the assistant.";
    }

    setTyping(false);
    setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    historyRef.current.push({ role: "assistant", content: reply });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <>
      <button onClick={toggleOpen} style={styles.launcher} title="Chat with us">
        💬
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <span>SolarGuide</span>
            <div style={styles.headerRight}>
              <div style={styles.langSwitch}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    style={{
                      ...styles.langBtn,
                      ...(lang === l.code ? styles.langBtnActive : {}),
                    }}
                    title={`Reply in ${l.label}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setOpen(false)} style={styles.closeBtn}>✕</button>
            </div>
          </div>

          <div style={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...styles.msg, ...(m.sender === "user" ? styles.msgUser : styles.msgBot) }}>
                {m.text}
                {m.imageUrl && <img src={m.imageUrl} alt="attachment" style={styles.msgImage} />}
              </div>
            ))}
            {typing && <div style={{ ...styles.msg, ...styles.msgBot, fontStyle: "italic", color: "#5b6b6a" }}>typing...</div>}
          </div>

          {pendingImage && (
            <div style={styles.previewRow}>
              <img src={pendingImage.dataUrl} alt="preview" style={styles.previewImg} />
              <span style={styles.previewName}>{pendingImage.name}</span>
              <button onClick={removeImage} style={styles.previewRemove} title="Remove image">✕</button>
            </div>
          )}

          <div style={styles.inputRow}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button onClick={() => fileInputRef.current.click()} style={styles.attachBtn} title="Attach an image">
              📎
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message (English/हिंदी/मराठी), or attach a photo..."
              style={styles.input}
            />
            <button onClick={sendMessage} style={styles.sendBtn}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- MODE: demo (no backend needed, works today) ---------- */
function guessLang(text) {
  const marathiHints = ["आहे", "तुमचं", "कसं", "मला", "पाहिजे", "काय"];
  if (marathiHints.some((w) => text.includes(w))) return "mr";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}

const TOPICS = [
  {
    keywords: ["hi", "hello", "hey", "namaste", "नमस्ते", "नमस्कार"],
    en: "Hey there! How can I help you with SolarAssist today?",
    hi: "नमस्ते! मैं SolarAssist में आपकी कैसे मदद कर सकता हूँ?",
    mr: "नमस्कार! मी SolarAssist मध्ये तुम्हाला कशी मदत करू शकतो?",
  },
  {
    keywords: ["subsidy", "सब्सिडी", "अनुदान"],
    en: "Subsidy amounts depend on your recommended system capacity and are shown on your Financial Analysis page, alongside the final cost after subsidy is applied.",
    hi: "सब्सिडी की राशि आपकी अनुशंसित सिस्टम क्षमता पर निर्भर करती है और यह आपके Financial Analysis पेज पर, सब्सिडी लागू होने के बाद की अंतिम लागत के साथ दिखाई जाती है।",
    mr: "सबसिडीची रक्कम तुमच्या शिफारस केलेल्या सिस्टम क्षमतेवर अवलंबून असते आणि ती तुमच्या Financial Analysis पेजवर, सबसिडीनंतरच्या अंतिम खर्चासह दाखवली जाते.",
  },
  {
    keywords: ["capacity", "recommendation", "kw", "panel size", "क्षमता", "शिफारस"],
    en: "Your recommended system capacity (in kW) and panel configuration are shown on the My Recommendation page, based on your Solar Planner inputs.",
    hi: "आपकी अनुशंसित सिस्टम क्षमता (kW में) और पैनल कॉन्फ़िगरेशन My Recommendation पेज पर दिखाई जाती है, जो आपके Solar Planner इनपुट पर आधारित है।",
    mr: "तुमची शिफारस केलेली सिस्टम क्षमता (kW मध्ये) आणि पॅनल कॉन्फिगरेशन My Recommendation पेजवर दाखवले जाते, जे तुमच्या Solar Planner इनपुटवर आधारित आहे.",
  },
  {
    keywords: ["saving", "savings", "बचत"],
    en: "Your estimated annual savings are calculated on the Financial Analysis page, based on your consumption and the recommended system size.",
    hi: "आपकी अनुमानित वार्षिक बचत Financial Analysis पेज पर, आपकी खपत और अनुशंसित सिस्टम साइज़ के आधार पर गणना की जाती है।",
    mr: "तुमची अंदाजे वार्षिक बचत Financial Analysis पेजवर, तुमच्या वापरावर आणि शिफारस केलेल्या सिस्टम आकारावर आधारित मोजली जाते.",
  },
  {
    keywords: ["payback", "roi", "return", "पेबैक"],
    en: "Payback period is how many years it takes for your energy savings to cover the installation cost after subsidy — you'll find it on the Financial Analysis page.",
    hi: "पेबैक पीरियड वह समय है जितने सालों में आपकी ऊर्जा बचत सब्सिडी के बाद की इंस्टॉलेशन लागत को कवर कर देती है — यह Financial Analysis पेज पर मिलेगा।",
    mr: "पेबॅक कालावधी म्हणजे किती वर्षांत तुमची ऊर्जा बचत सबसिडीनंतरचा इंस्टॉलेशन खर्च भरून काढते — हे Financial Analysis पेजवर मिळेल.",
  },
  {
    keywords: ["roof", "छत", "छप्पर"],
    en: "Roof type and available area are entered in Step 3 of the Solar Planner — they directly affect the recommended system size.",
    hi: "छत का प्रकार और उपलब्ध क्षेत्र Solar Planner के Step 3 में दर्ज किया जाता है — यह अनुशंसित सिस्टम साइज़ को सीधे प्रभावित करता है।",
    mr: "छताचा प्रकार आणि उपलब्ध जागा Solar Planner च्या Step 3 मध्ये टाकली जाते — याचा शिफारस केलेल्या सिस्टम आकारावर थेट परिणाम होतो.",
  },
  {
    keywords: ["battery", "बैटरी"],
    en: "You can indicate whether you want battery backup in Step 3 of the Solar Planner, and battery sizing (if requested) shows up in My Recommendation.",
    hi: "आप Solar Planner के Step 3 में बैटरी बैकअप चाहते हैं या नहीं, यह बता सकते हैं, और बैटरी साइज़िंग (यदि अनुरोध की गई हो) My Recommendation में दिखती है।",
    mr: "तुम्हाला बॅटरी बॅकअप हवा आहे का हे Solar Planner च्या Step 3 मध्ये सांगता येते, आणि बॅटरी साईझिंग (विनंती केल्यास) My Recommendation मध्ये दिसते.",
  },
  {
    keywords: ["explain", "shap", "why", "factor"],
    en: "The Explainable AI page shows which input factors (consumption, roof area, location, budget) influenced your recommendation the most, in plain language.",
    hi: "Explainable AI पेज दिखाता है कि किन इनपुट फैक्टर्स (खपत, छत का क्षेत्र, स्थान, बजट) ने आपकी सिफारिश को सबसे ज्यादा प्रभावित किया, आसान भाषा में।",
    mr: "Explainable AI पेज दाखवतो की कोणत्या इनपुट फॅक्टर्सनी (वापर, छताचे क्षेत्रफळ, ठिकाण, बजेट) तुमच्या शिफारशीवर सर्वात जास्त परिणाम केला, सोप्या भाषेत.",
  },
  {
    keywords: ["vendor", "pending", "approve", "वेंडर"],
    en: "New vendor accounts start as PENDING and can't log in until an Admin approves them under Vendor Approvals — make sure you're using the Vendor Login page too.",
    hi: "नए वेंडर अकाउंट PENDING स्थिति में शुरू होते हैं और तब तक लॉगिन नहीं कर सकते जब तक Admin उन्हें Vendor Approvals में अप्रूव नहीं करता — यह भी सुनिश्चित करें कि आप Vendor Login पेज का उपयोग कर रहे हैं।",
    mr: "नवीन वेंडर खाती PENDING स्थितीत सुरू होतात आणि Admin ने Vendor Approvals मध्ये मंजूर करेपर्यंत लॉगिन करता येत नाही — तुम्ही Vendor Login पेज वापरत आहात याचीही खात्री करा.",
  },
  {
    keywords: ["admin", "एडमिन"],
    en: "Admin access is role-restricted and can't be self-registered — only an existing Admin can grant that access.",
    hi: "एडमिन एक्सेस रोल-आधारित है और इसे खुद रजिस्टर नहीं किया जा सकता — केवल कोई मौजूदा एडमिन ही यह एक्सेस दे सकता है।",
    mr: "एडमिन अॅक्सेस भूमिकेनुसार मर्यादित आहे आणि स्वतः नोंदणी करता येत नाही — फक्त विद्यमान एडमिनच ही अॅक्सेस देऊ शकतो.",
  },
  {
    keywords: ["password", "forgot", "reset", "पासवर्ड"],
    en: "You can reset your password from the Forgot Password page — the reset link is valid for 30 minutes.",
    hi: "आप Forgot Password पेज से अपना पासवर्ड रीसेट कर सकते हैं — रीसेट लिंक 30 मिनट के लिए मान्य है।",
    mr: "तुम्ही Forgot Password पेजवरून तुमचा पासवर्ड रीसेट करू शकता — रीसेट लिंक 30 मिनिटांसाठी वैध असते.",
  },
  {
    keywords: ["report", "रिपोर्ट"],
    en: "Your past solar plans are listed on the Reports page, each with a downloadable PDF.",
    hi: "आपकी पिछली सोलर योजनाएँ Reports पेज पर सूचीबद्ध हैं, हर एक के साथ डाउनलोड करने योग्य PDF है।",
    mr: "तुमच्या मागील सोलर योजना Reports पेजवर सूचीबद्ध आहेत, प्रत्येकासोबत डाउनलोड करण्यायोग्य PDF आहे.",
  },
  {
    keywords: ["thanks", "thank you", "धन्यवाद", "शुक्रिया"],
    en: "You're welcome! Anything else I can help with?",
    hi: "आपका स्वागत है! क्या मैं और किसी चीज़ में मदद कर सकता हूँ?",
    mr: "स्वागत आहे! अजून काही मदत हवी आहे का?",
  },
];

function matchDemoTopic(text) {
  const t = text.toLowerCase();
  return TOPICS.find((topic) => topic.keywords.some((k) => t.includes(k.toLowerCase())));
}

function getDemoImageReply(image, text) {
  const hint = ((image.name || "") + " " + (text || "")).toLowerCase();
  if (/bill|invoice|receipt|बिल/.test(hint)) {
    return "This looks like an electricity bill. Once API mode is on, I'll read the monthly units (kWh) and bill amount straight off it for Step 1 of the Solar Planner. For now, you can enter those numbers manually there.";
  }
  if (/panel|solar|पैनल|सौर/.test(hint)) {
    return "Got a panel photo! In API mode I'll check it for visible issues like dust buildup, cracks, discoloration/hotspots, bird droppings, shading, or loose wiring. For now, a quick manual check: look for cracks, heavy dust, or discolored patches — those usually mean it's worth a professional inspection.";
  }
  if (/roof|छत|terrace/.test(hint)) {
    return "This looks like a rooftop photo. In API mode I can give a rough read on roof type and shading for Step 3 of the Solar Planner. For now, note down the roof type (RCC/Sheet/Tile) and approximate area yourself for that step.";
  }
  return "Got the image! In API mode I can tell whether this is a bill, a rooftop, or a panel and respond accordingly — for now, let me know which it is and I'll point you to the right page.";
}

// NOTE: demo mode uses guessLang() from the message text since it has no
// real language selector wired to it historically — now that `lang` is
// selected explicitly via the UI, we prefer that when available.
function getDemoReply(text, image, selectedLang) {
  if (image) {
    return new Promise((resolve) => setTimeout(() => resolve(getDemoImageReply(image, text)), 500));
  }
  const lang = selectedLang || guessLang(text || "");
  const topic = matchDemoTopic(text || "");
  const reply = topic
    ? topic[lang] || topic.en
    : lang === "hi"
    ? "मुझे अभी इस बारे में यकीन नहीं है — सब्सिडी, क्षमता, बचत, पेबैक, वेंडर या रिपोर्ट के बारे में पूछें।"
    : lang === "mr"
    ? "मला याबद्दल अजून खात्री नाही — सबसिडी, क्षमता, बचत, पेबॅक, वेंडर किंवा रिपोर्टबद्दल विचारा."
    : "I'm not sure about that yet in demo mode — try asking about subsidy, capacity, savings, payback, roof, battery, vendors, or reports.";
  return new Promise((resolve) => setTimeout(() => resolve(reply), 500));
}

/* ---------- MODE: api (real backend call, handles text AND images) ---------- */
async function getApiReply(text, image, lang) {
  const res = await fetch(CONFIG.API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      image: image ? { base64: image.base64, mimeType: image.mimeType } : null,
      history: [], // pass real history here if you want multi-turn context
      lang, // NEW: selected reply language, e.g. "en" | "hi" | "mr"
    }),
  });
  if (!res.ok) throw new Error("Bad response from server");
  const data = await res.json();
  return data.reply;
}

/* ---------- styles (plain objects — no Tailwind/CSS file needed) ---------- */
const styles = {
  launcher: {
    position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: "50%", background: "#4FC3E8", color: "white", border: "none",
    cursor: "pointer", boxShadow: "0 6px 16px rgba(79,195,232,0.35)", fontSize: 24,
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
  },
  panel: {
    position: "fixed", bottom: 92, right: 24, width: 340, maxWidth: "90vw",
    height: 460, maxHeight: "70vh", background: "#ffffff", borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)", display: "flex",
    flexDirection: "column", overflow: "hidden", zIndex: 9999,
    border: "1px solid #E3F4FA",
  },
  header: {
    background: "linear-gradient(135deg, #4FC3E8, #2FA8D6)", color: "white", padding: "14px 16px", fontWeight: 600,
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  langSwitch: { display: "flex", gap: 4, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 2 },
  langBtn: {
    background: "none", border: "none", color: "rgba(255,255,255,0.75)",
    fontSize: 12, fontWeight: 600, padding: "4px 7px", borderRadius: 6, cursor: "pointer",
  },
  langBtnActive: { background: "white", color: "#2FA8D6" },
  closeBtn: { background: "none", border: "none", color: "white", fontSize: 18, cursor: "pointer" },
  messages: {
    flex: 1, overflowY: "auto", padding: 14, display: "flex",
    flexDirection: "column", gap: 10, background: "#F5FBFE",
  },
  msg: { maxWidth: "80%", padding: "9px 13px", borderRadius: 14, fontSize: 14, lineHeight: 1.4, whiteSpace: "pre-wrap" },
  msgBot: { background: "#E6F6FC", color: "#1C2A2A", alignSelf: "flex-start", borderBottomLeftRadius: 4, border: "1px solid #D3EEF7" },
  msgUser: { background: "#4FC3E8", color: "white", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  msgImage: { maxWidth: "100%", borderRadius: 10, display: "block", marginTop: 6 },
  previewRow: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px 0 12px", background: "#ffffff" },
  previewImg: { width: 42, height: 42, objectFit: "cover", borderRadius: 8, border: "1px solid #D3EEF7" },
  previewName: { fontSize: 12, color: "#5b8a99", flex: 1 },
  previewRemove: { background: "none", border: "none", cursor: "pointer", color: "#5b8a99", fontSize: 14 },
  inputRow: { display: "flex", alignItems: "center", borderTop: "1px solid #E3F4FA", padding: 10, gap: 8, background: "#ffffff" },
  attachBtn: { background: "none", border: "none", fontSize: 19, cursor: "pointer", color: "#5b8a99" },
  input: { flex: 1, border: "1px solid #D3EEF7", borderRadius: 20, padding: "9px 14px", fontSize: 14, outline: "none" },
  sendBtn: { background: "#4FC3E8", color: "white", border: "none", borderRadius: 20, padding: "0 16px", cursor: "pointer", fontSize: 14 },
};
