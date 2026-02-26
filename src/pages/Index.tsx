import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Users, Zap, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_featured", true)
        .order("date", { ascending: true })
        .limit(4);
      if (data) setFeaturedEvents(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="container relative mx-auto text-center">
          <Badge variant="secondary" className="mb-4 gap-1 px-4 py-1.5 text-sm">
            <Zap className="h-3.5 w-3.5 text-primary" /> AI-Enhanced Event Management
          </Badge>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Discover & Register for{" "}
            <span className="text-gradient-primary">Campus Events</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Browse workshops, hackathons, seminars, and cultural events.
            Get AI-powered recommendations and instant QR code passes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate(user ? "/events" : "/auth?mode=signup")} className="gap-2 text-base">
              {user ? "Browse Events" : "Get Started"} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/events")} className="text-base">
              Explore Events
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card px-4 py-16">
        <div className="container mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Calendar, title: "Easy Registration", desc: "Register for events in seconds with real-time seat tracking" },
              { icon: Zap, title: "AI Recommendations", desc: "Get personalized event suggestions based on your interests" },
              { icon: Shield, title: "QR Code Passes", desc: "Receive unique QR codes for seamless event check-in" },
              { icon: Users, title: "Smart Waitlist", desc: "Auto-promoted from waitlist when seats become available" },
            ].map((f) => (
              <div key={f.title} className="text-center animate-fade-in">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Featured Events</h2>
              <p className="text-muted-foreground">Don't miss these upcoming highlights</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/events")} className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-[380px] animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-4 py-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">EventHub</span> — AI-Enhanced Event Management System
          </p>
          <p className="mt-2">© 2026 All rights reserved. Built for academic demonstration.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
