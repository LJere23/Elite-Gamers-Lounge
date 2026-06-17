export const dynamic = "force-dynamic";

import Hero from "@/sections/Hero/Hero";
import Announcements from "@/sections/Announcements/Announcements";
import Countdown from "@/sections/Countdown/Countdown";
import Features from "@/sections/Features/Features";
import Leaderboards from "@/sections/Leaderboards/Leaderboards";
import Memberships from "@/sections/Memberships/Memberships";
import Community from "@/sections/Community/Community";
import QuestBoard from "@/sections/QuestBoard/QuestBoard";
import Gallery from "@/sections/Gallery/Gallery";
import Testimonials from "@/sections/Testimonials/Testimonials";
import CTA from "@/sections/CTA/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Announcements />
      <Countdown />
      <Features />
      <Community />
      <Leaderboards />
      <QuestBoard />
      <Memberships />
      <Gallery />
      <Testimonials />
      <CTA />
    </>
  );
}