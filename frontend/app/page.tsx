import Link from "next/link";
import { ArrowRight, Shirt } from "lucide-react";

export default function Home() {
  return (
    <main className="home-splash">
      <Link className="home-brand" href="/Register">
        <span><Shirt size={19} /></span> threadline<span className="home-brand-dot">.</span>
      </Link>
      <div className="home-splash-copy">
        <span className="home-kicker">AI-POWERED GARMENT SOURCING</span>
        <h1>Better things are<br />made <em>together.</em></h1>
        <p>Meet the people and partners who can bring your next idea to life.</p>
        <Link className="home-start-button" href="/Register">
          Explore Threadline <ArrowRight size={17} />
        </Link>
        <Link className="home-login-link" href="/login">Already a member? Log in</Link>
      </div>
      <div className="home-bottom-note">A new thread connecting the garment industry.</div>
    </main>
  );
}
