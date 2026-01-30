import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users } from "lucide-react";
import { toast } from "sonner";

export default function SharedWorldChat({ worldId }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['worldChat', worldId],
    queryFn: () => base44.entities.WorldChatMessage.filter({ world_id: worldId }, '-created_date', 50),
    refetchInterval: 5000
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.WorldChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldChat', worldId] });
      setMessage("");
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({
      world_id: worldId,
      sender: user.email,
      sender_name: user.full_name || user.email,
      content: message,
      timestamp: new Date().toISOString()
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="bg-slate-800/50 border-green-500/30">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          World Chat
          <Badge variant="outline" className="ml-auto">
            <Users className="w-3 h-3 mr-1" />
            {new Set(messages.map(m => m.sender)).size} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 overflow-y-auto space-y-2 bg-slate-900/50 rounded p-3">
          {messages.reverse().map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded ${
                msg.sender === user?.email
                  ? 'bg-green-900/30 ml-8'
                  : 'bg-slate-700/30 mr-8'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white">
                  {msg.sender_name}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(msg.created_date).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-slate-200">{msg.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="bg-slate-700/50 border-slate-600 text-white"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}