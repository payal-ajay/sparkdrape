import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DRAPE — Elevate your brand. Define your legacy." },
      { name: "description", content: "DRAPE — campaign intelligence for premium Indian fashion brands. Powered by SPARK AI." },
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing-root">
      <style>{`
        .landing-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(160deg, #F5F0E8, #EDE8DF);
          font-family: 'Cormorant Garamond', serif;
          overflow: hidden;
        }
        .landing-root::before {
          content: "";
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.04;
          pointer-events: none;
          z-index: 0;
        }
        .landing-top { position: absolute; top: 32px; font-size: 11px; color: #9C8472; letter-spacing: 0.15em; z-index: 2; font-family: 'Inter', sans-serif; }
        .landing-tl { left: 40px; }
        .landing-tr { right: 40px; font-style: italic; }
        .landing-center {
          position: relative; z-index: 1;
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 0; padding: 80px 24px;
        }
        @keyframes lp-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lp-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lp-scale-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .lp-logo { animation: lp-fade-up 900ms ease-out both; margin-bottom: 24px; }
        .lp-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 56px; font-weight: 300;
          letter-spacing: 0.35em; color: #2C1810;
          margin: 0 0 20px 0;
          animation: lp-fade-up 700ms ease-out 250ms both;
        }
        .lp-tag {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 300; font-style: italic;
          color: #6B5744; line-height: 1.8;
          text-align: center; margin: 0;
          animation: lp-fade 700ms ease-out 500ms both;
        }
        .lp-tag-wrap { margin-bottom: 32px; }
        .lp-divider {
          width: 64px; height: 1px; background: #C4A882;
          margin: 0 auto 32px auto; transform-origin: center;
          animation: lp-scale-x 600ms ease-out 750ms both;
        }
        .lp-btn {
          height: 48px; min-width: 180px; border-radius: 24px;
          background: #2C1810; color: #F5F0E8;
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px; font-weight: 500; letter-spacing: 0.15em;
          text-transform: uppercase; border: none; cursor: pointer;
          padding: 0 40px;
          transition: background 200ms ease, transform 200ms ease;
          margin-bottom: 16px;
          animation: lp-fade-up 600ms ease-out 950ms both;
        }
        .lp-btn:hover { background: #4A2E1A; transform: scale(1.02); }
        .lp-sub {
          font-family: 'Inter', sans-serif;
          font-size: 11px; color: #9C8472; letter-spacing: 0.1em;
          animation: lp-fade 500ms ease-out 1100ms both;
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-logo, .lp-name, .lp-tag, .lp-divider, .lp-btn, .lp-sub { animation: none !important; }
        }
      `}</style>
      <span className="landing-top landing-tl">SPARK</span>
      <span className="landing-top landing-tr">estd. 2026</span>
      <div className="landing-center">
        <svg className="lp-logo" viewBox="0 0 100 120" width="100" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="52" cy="10" rx="7" ry="8" fill="#2C1810"/>
          <path d="M45 18 Q38 28 35 40 Q32 52 36 58 Q42 62 52 60 Q62 58 66 52 Q68 44 65 36 Q62 26 56 18 Z" fill="#2C1810"/>
          <path d="M36 56 Q28 68 22 82 Q18 92 20 100 Q24 106 32 104 Q36 100 38 90 Q40 80 42 72 Q46 80 48 90 Q50 100 52 108 Q54 114 58 112 Q64 108 62 98 Q60 86 56 74 Q60 80 65 88 Q68 96 72 98 Q78 100 80 94 Q82 86 76 76 Q68 64 60 56 Z" fill="#2C1810"/>
          <path d="M20 100 Q10 108 8 114 Q6 118 12 118 Q20 116 28 108" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M58 110 Q62 116 70 118 Q76 118 74 114 Q72 110 66 106" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M38 42 Q30 44 26 50" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>
        <h1 className="lp-name">DRAPE</h1>
        <div className="lp-tag-wrap">
          <p className="lp-tag">Elevate your brand.</p>
          <p className="lp-tag">Define your legacy.</p>
        </div>
        <div className="lp-divider" />
        <button className="lp-btn" onClick={() => navigate({ to: "/dashboard" })}>Get Started</button>
        <span className="lp-sub">Powered by SPARK AI</span>
      </div>
    </div>
  );
}
