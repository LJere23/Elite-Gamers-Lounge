"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { slideUp } from "@/animations/slide";

interface CommunityData {
  communityHeadline: string;
  communityBody: string;
  communityStat1Label: string;
  communityStat1Value: string;
  communityStat2Label: string;
  communityStat2Value: string;
  communityStat3Label: string;
  communityStat3Value: string;
}

const DEFAULTS: CommunityData = {
  communityHeadline: "Join Our Gaming Community",
  communityBody:
    "Elite Gamers Lounge is more than a gaming venue — it's a community of competitive players, casual gamers, and esports enthusiasts all under one roof.",
  communityStat1Label: "Members",
  communityStat1Value: "200+",
  communityStat2Label: "Tournaments",
  communityStat2Value: "50+",
  communityStat3Label: "Games Available",
  communityStat3Value: "30+",
};

export default function Community() {
  const [data, setData] = useState<CommunityData>(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setData({
          communityHeadline: s.communityHeadline || DEFAULTS.communityHeadline,
          communityBody: s.communityBody || DEFAULTS.communityBody,
          communityStat1Label: s.communityStat1Label || DEFAULTS.communityStat1Label,
          communityStat1Value: s.communityStat1Value || DEFAULTS.communityStat1Value,
          communityStat2Label: s.communityStat2Label || DEFAULTS.communityStat2Label,
          communityStat2Value: s.communityStat2Value || DEFAULTS.communityStat2Value,
          communityStat3Label: s.communityStat3Label || DEFAULTS.communityStat3Label,
          communityStat3Value: s.communityStat3Value || DEFAULTS.communityStat3Value,
        });
      })
      .catch(() => {});
  }, []);

  const stats = [
    { label: data.communityStat1Label, value: data.communityStat1Value },
    { label: data.communityStat2Label, value: data.communityStat2Value },
    { label: data.communityStat3Label, value: data.communityStat3Value },
  ];

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="uppercase tracking-[0.3em] text-purple-400 mb-4">Community</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase mb-8 leading-tight">
              {data.communityHeadline}
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-10">{data.communityBody}</p>

            <a
              href={`/contact`}
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-500 transition px-8 py-4 text-white font-black"
            >
              Join us today
            </a>
          </motion.div>

          {/* Right — stats */}
          <motion.div
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 flex items-center gap-8 hover:border-purple-400/30 transition"
              >
                <span className="text-5xl font-black text-purple-400 shrink-0">
                  {stat.value}
                </span>
                <span className="text-xl font-semibold text-white">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
