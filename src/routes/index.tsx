import { createFileRoute, useNavigate } from "@tanstack/react-router";
import moodboard from "@/assets/moodboard.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DRAPE — Elevate your brand. Define your legacy." },
      { name: "description", content: "DRAPE — campaign intelligence for premium Indian fashion brands. Powered by SPARK AI." },
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&display=swap" },
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
          overflow: hidden;
          font-family: 'Cormorant Garamond', serif;
          background: #0B0B0E;
        }
        .landing-bg {
          position: absolute; inset: 0;
          background-image: url('${moodboard.url}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }
        .landing-overlay {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at center, rgba(11,11,14,0.35) 0%, rgba(11,11,14,0.75) 70%, rgba(11,11,14,0.92) 100%),
            linear-gradient(180deg, rgba(11,11,14,0.55), rgba(11,11,14,0.55));
          z-index: 1;
        }
        .landing-grain {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
          opacity: 0.06;
          mix-blend-mode: overlay;
        }
        .landing-top {
          position: absolute; top: 32px; font-size: 11px; color: rgba(245,240,232,0.7);
          letter-spacing: 0.25em; z-index: 4; font-family: 'Inter', sans-serif; text-transform: uppercase;
        }
        .landing-tl { left: 40px; }
        .landing-tr { right: 40px; font-style: italic; text-transform: none; letter-spacing: 0.15em; font-family: 'Cormorant Garamond', serif; font-size: 13px; }
        .landing-center {
          position: relative; z-index: 3;
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 80px 24px;
        }
        @keyframes lp-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lp-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lp-scale-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        .lp-eyebrow {
          font-family: 'Inter', sans-serif;
          font-size: 10px; letter-spacing: 0.4em;
          color: rgba(245,240,232,0.6); text-transform: uppercase;
          margin-bottom: 28px;
          animation: lp-fade 800ms ease-out both;
        }
        .lp-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(64px, 12vw, 140px); font-weight: 300;
          letter-spacing: 0.32em; color: #F5F0E8;
          margin: 0 0 28px 0; line-height: 1;
          text-shadow: 0 2px 40px rgba(0,0,0,0.4);
          animation: lp-fade-up 900ms ease-out 200ms both;
        }
        .lp-divider {
          width: 72px; height: 1px; background: rgba(196,168,130,0.7);
          margin: 0 auto 28px auto; transform-origin: center;
          animation: lp-scale-x 700ms ease-out 600ms both;
        }
        .lp-tag {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(20px, 2.6vw, 28px); font-weight: 300; font-style: italic;
          color: rgba(245,240,232,0.92); line-height: 1.7;
          text-align: center; margin: 0;
          animation: lp-fade 900ms ease-out 750ms both;
        }
        .lp-tag-wrap { margin-bottom: 44px; }
        .lp-btn {
          height: 52px; min-width: 200px; border-radius: 28px;
          background: #F5F0E8; color: #1A0F08;
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px; font-weight: 500; letter-spacing: 0.25em;
          text-transform: uppercase; border: none; cursor: pointer;
          padding: 0 44px;
          transition: background 200ms ease, transform 200ms ease, box-shadow 200ms ease;
          margin-bottom: 18px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          animation: lp-fade-up 700ms ease-out 950ms both;
        }
        .lp-btn:hover { background: #FFFFFF; transform: translateY(-2px); box-shadow: 0 14px 50px rgba(0,0,0,0.5); }
        .lp-sub {
          font-family: 'Inter', sans-serif;
          font-size: 10px; color: rgba(245,240,232,0.55); letter-spacing: 0.3em; text-transform: uppercase;
          animation: lp-fade 600ms ease-out 1200ms both;
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-eyebrow, .lp-name, .lp-tag, .lp-divider, .lp-btn, .lp-sub { animation: none !important; }
        }
      `}</style>
      <div className="landing-bg" />
      <div className="landing-overlay" />
      <div className="landing-grain" />
      <span className="landing-top landing-tl">SPARK</span>
      <span className="landing-top landing-tr">estd. 2026</span>
      <div className="landing-center">
        <div className="lp-eyebrow">A Campaign Intelligence Studio</div>
        <h1 className="lp-name">DRAPE</h1>
        <div className="lp-divider" />
        <div className="lp-tag-wrap">
          <p className="lp-tag">Elevate your brand.</p>
          <p className="lp-tag">Define your legacy.</p>
        </div>
        <button className="lp-btn" onClick={() => navigate({ to: "/dashboard" })}>Get Started</button>
        <span className="lp-sub">Powered by SPARK AI</span>
      </div>
    </div>
  );
}
