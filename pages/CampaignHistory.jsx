import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionRecapCard from "../components/campaign/SessionRecapCard";

const createPageUrl = (pageName) => `/${pageName}`;

export default function CampaignHistory() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaignId');

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await base44.entities.Campaign.filter({ id: campaignId });
      return campaigns[0];
    },
    enabled: !!campaignId
  });

  const { data: recaps, isLoading } = useQuery({
    queryKey: ['session-recaps', campaignId],
    queryFn: () => base44.entities.SessionRecap.filter({ campaign_id: campaignId }, '-session_number'),
    enabled: !!campaignId,
    initialData: []
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <Link to={createPageUrl(`Campaign?characterId=${urlParams.get('characterId')}`)}>
          <Button variant="ghost" className="mb-6 text-purple-300 hover:text-purple-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Chronicle of Adventures
            </h1>
          </div>
          {campaign && (
            <p className="text-xl text-purple-200">{campaign.title}</p>
          )}
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-6">
          {isLoading && (
            <div className="text-center text-purple-300">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <BookOpen className="w-12 h-12" />
              </motion.div>
              <p>Loading session recaps...</p>
            </div>
          )}

          {!isLoading && recaps.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
              <p className="text-lg text-purple-300">
                No session recaps yet. Generate your first recap after a session!
              </p>
            </motion.div>
          )}

          {recaps.map((recap, index) => (
            <SessionRecapCard key={recap.id} recap={recap} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}