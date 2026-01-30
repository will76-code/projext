import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Scroll, Sparkles } from "lucide-react";
import { format } from "date-fns";

export default function SessionRecapCard({ recap, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/30 hover:border-purple-400 transition-all">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600/80">
                  Session {recap.session_number}
                </Badge>
                <span className="text-xs text-purple-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(recap.session_date), 'MMM d, yyyy')}
                </span>
              </div>
              <CardTitle className="text-xl text-purple-100">
                {recap.title || `Session ${recap.session_number}`}
              </CardTitle>
            </div>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* AI-Generated Summary */}
          <div>
            <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
              <Scroll className="w-4 h-4" />
              Story Summary
            </h4>
            <p className="text-sm text-purple-200 leading-relaxed whitespace-pre-wrap">
              {recap.summary}
            </p>
          </div>

          {/* Key Events */}
          {recap.key_events?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">
                Key Moments
              </h4>
              <ul className="space-y-1">
                {recap.key_events.map((event, i) => (
                  <li key={i} className="text-sm text-purple-200 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{event}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Character Progression */}
          {recap.character_progression && (
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">
                Character Growth
              </h4>
              <p className="text-sm text-purple-200 italic">
                {recap.character_progression}
              </p>
            </div>
          )}

          {/* NPCs & Loot */}
          <div className="grid grid-cols-2 gap-4">
            {recap.npcs_encountered?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  NPCs Met
                </h4>
                <div className="flex flex-wrap gap-1">
                  {recap.npcs_encountered.map((npc, i) => (
                    <Badge key={i} variant="outline" className="text-xs text-purple-300 border-purple-500/30">
                      {npc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {recap.loot_obtained?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-purple-300 mb-1">
                  Loot Acquired
                </h4>
                <div className="flex flex-wrap gap-1">
                  {recap.loot_obtained.map((item, i) => (
                    <Badge key={i} variant="outline" className="text-xs text-amber-300 border-amber-500/30">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}