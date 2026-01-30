import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit3, Calendar, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import AIConflictGenerator from "@/components/ai/AIConflictGenerator";

export default function TimelineBuilder({ worldId, initialEvents = [], onEventsChange, relationships = [], characters = [] }) {
  const [events, setEvents] = useState(initialEvents);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventYear, setEventYear] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Notify parent when events change
  React.useEffect(() => {
    if (onEventsChange) onEventsChange(events);
  }, [events]);

  const addEvent = () => {
    if (!eventTitle.trim() || !eventYear.trim()) {
      toast.error("Enter title and year");
      return;
    }

    const newEvent = {
      id: editingId || `event_${Date.now()}`,
      title: eventTitle,
      description: eventDescription,
      year: parseInt(eventYear)
    };

    if (editingId) {
      setEvents(events.map(e => e.id === editingId ? newEvent : e));
      toast.success("Event updated");
      setEditingId(null);
    } else {
      setEvents([...events, newEvent]);
      toast.success("Event added");
    }

    setEventTitle("");
    setEventDescription("");
    setEventYear("");
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
    toast.success("Event deleted");
  };

  const editEvent = (event) => {
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEventYear(event.year.toString());
    setEditingId(event.id);
  };

  const sortedEvents = [...events].sort((a, b) => a.year - b.year);
  const minYear = Math.min(...events.map(e => e.year), 0);
  const maxYear = Math.max(...events.map(e => e.year), 100);
  const yearRange = maxYear - minYear || 1;

  const generateTimelineEvents = async () => {
    setAiGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 significant world events for a ${worldId || 'fantasy'} setting spanning 100 years. Include conflicts, discoveries, political shifts, and cultural moments. Each should feel interconnected.
        
Return as JSON with "events" array containing objects with "title", "date" (in format "year X"), "type" (major/minor/turning_point), and "description".`,
        response_json_schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  date: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      const newEvents = response.events.map(e => ({
        id: `event_${Date.now()}_${Math.random()}`,
        title: e.title,
        date: e.date,
        type: e.type || "major",
        description: e.description
      }));

      setEvents([...events, ...newEvents]);
      toast.success("Timeline events generated!");
    } catch (error) {
      toast.error("Failed to generate events");
    }
    setAiGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
         <div className="flex items-center justify-between">
           <CardTitle className="text-amber-300 flex items-center gap-2">
             <Calendar className="w-5 h-5" />
             World Timeline
           </CardTitle>
           <div className="flex gap-2">
             <Button
               onClick={generateTimelineEvents}
               disabled={aiGenerating}
               size="sm"
               className="bg-amber-600 hover:bg-amber-700"
             >
               {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
               AI Generate
             </Button>
             <AIConflictGenerator 
               worldId={worldId}
               events={events}
               relationships={relationships}
               characters={characters}
             />
           </div>
         </div>
       </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline Visualization */}
        <div className="relative h-64 bg-slate-900/30 rounded border border-slate-700 p-4">
          <div className="relative h-full">
            {/* Timeline line */}
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-gradient-to-r from-amber-900 to-amber-700 transform -translate-y-1/2" />

            {/* Events */}
            {sortedEvents.map((event, idx) => {
              const position = ((event.year - minYear) / yearRange) * 95 + 2;
              const isAbove = idx % 2 === 0;

              return (
                <div key={event.id} className="absolute group" style={{ left: `${position}%` }}>
                  <div className={`absolute w-48 ${isAbove ? 'bottom-12' : 'top-12'} left-1/2 transform -translate-x-1/2 bg-slate-700 rounded p-2 border border-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                    <p className="font-semibold text-amber-300 text-sm">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => editEvent(event)}
                      className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 transition-colors"
                      title="Click to edit"
                    />
                    <span className="text-xs text-amber-300 font-semibold">{event.year}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add/Edit Event Form */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              {editingId ? "Edit Event" : "Add Event"}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-amber-300">
                {editingId ? "Edit" : "Add"} Timeline Event
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Event title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
              <Input
                placeholder="Year"
                type="number"
                value={eventYear}
                onChange={(e) => setEventYear(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
              <textarea
                placeholder="Description (optional)"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 min-h-20"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEventTitle("");
                    setEventDescription("");
                    setEventYear("");
                    setEditingId(null);
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addEvent}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {editingId ? "Update" : "Add"} Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Events List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedEvents.map((event) => (
            <div key={event.id} className="flex items-start justify-between bg-slate-700/30 border border-slate-700 rounded p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-sm">{event.year}</span>
                  <p className="font-semibold text-slate-200">{event.title}</p>
                </div>
                {event.description && (
                  <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                )}
              </div>
              <Button
                onClick={() => deleteEvent(event.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}