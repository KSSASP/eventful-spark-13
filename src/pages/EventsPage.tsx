import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";

const categories = ["All", "Workshop", "Hackathon", "Seminar", "Cultural", "Competition"];

const EventsPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
      if (data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();

    const channel = supabase
      .channel("events-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setEvents((prev) => prev.map((e) => (e.id === (payload.new as any).id ? payload.new : e)));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || e.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Explore Events</h1>
          <p className="text-muted-foreground">Discover workshops, hackathons, seminars, and more</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                variant={category === c ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[400px] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">No events found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
