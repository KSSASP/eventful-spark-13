import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Calendar, Users, Zap, Shield, Clock, Star, ChevronDown, ChevronUp, Send, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CountdownTimer from "@/components/CountdownTimer";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date().toISOString();
      const [featured, upcoming, past] = await Promise.all([
        supabase.from("events").select("*").eq("is_featured", true).gte("date", now).order("date", { ascending: true }).limit(4),
        supabase.from("events").select("*").gte("date", now).order("date", { ascending: true }).limit(6),
        supabase.from("events").select("*").lt("date", now).order("date", { ascending: false }).limit(4),
      ]);
      if (featured.data) setFeaturedEvents(featured.data);
      if (upcoming.data) setUpcomingEvents(upcoming.data);
      if (past.data) setPastEvents(past.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const faqs = [
    { q: "How do I register for an event?", a: "Simply browse our events, click on any event you're interested in, and hit the 'Register Now' button. You'll need to create an account first if you haven't already." },
    { q: "What happens when an event is full?", a: "You'll be automatically added to the waitlist. When a seat becomes available, the next person on the waitlist is automatically promoted and notified." },
    { q: "How do I get my QR code for event entry?", a: "After successful registration, a unique QR code is generated and available in your Dashboard under 'My Events'. Show this QR code at the event entrance." },
    { q: "Can I cancel my registration?", a: "Yes! Go to your Dashboard, find the event, and click the 'Cancel' button. If you were confirmed, the next waitlisted person will be promoted automatically." },
    { q: "How does the AI recommendation work?", a: "Our AI analyzes your interests and past registrations to suggest events you're most likely to enjoy. Visit the 'AI Recommendations' tab in your Dashboard to see personalized suggestions." },
  ];

  const testimonials = [
    { name: "Sarah Johnson", role: "Computer Science Student", text: "EventHub made it so easy to discover and register for campus workshops. The QR code entry system is brilliant!", rating: 5 },
    { name: "Michael Chen", role: "Event Organizer", text: "Managing events has never been easier. The real-time seat tracking and waitlist system work flawlessly.", rating: 5 },
    { name: "Priya Patel", role: "Graduate Student", text: "The AI recommendations helped me find hackathons I never would have discovered on my own. Highly recommend!", rating: 5 },
    { name: "James Wilson", role: "Faculty Advisor", text: "The admin dashboard gives us all the analytics we need. A great tool for academic event management.", rating: 4 },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSendingContact(true);
    setTimeout(() => {
      toast.success("Message sent! We'll get back to you soon.");
      setContactForm({ name: "", email: "", message: "" });
      setSendingContact(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(168 80% 36% / 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(210 90% 52% / 0.06) 0%, transparent 50%)" }} />
        <div className="container relative mx-auto text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-5 py-2 text-sm font-medium">
            <Zap className="h-3.5 w-3.5 text-primary" /> AI-Enhanced Event Management
          </Badge>
          <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
            Discover & Register for{" "}
            <span className="text-gradient-primary">Campus Events</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Browse workshops, hackathons, seminars, and cultural events.
            Get AI-powered recommendations and instant QR code passes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate(user ? "/events" : "/auth?mode=signup")} className="gap-2 px-8 text-base shadow-lg">
              {user ? "Browse Events" : "Get Started"} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/events")} className="px-8 text-base">
              Explore Events
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>500+ Students</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>50+ Events</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span>4.9 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card px-4 py-20">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Why EventHub?</h2>
            <p className="mt-2 text-muted-foreground">Everything you need for seamless event management</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Calendar, title: "Easy Registration", desc: "Register for events in seconds with real-time seat tracking" },
              { icon: Zap, title: "AI Recommendations", desc: "Get personalized event suggestions based on your interests" },
              { icon: Shield, title: "QR Code Passes", desc: "Receive unique QR codes for seamless event check-in" },
              { icon: Users, title: "Smart Waitlist", desc: "Auto-promoted from waitlist when seats become available" },
            ].map((f) => (
              <Card key={f.title} className="border-0 bg-background shadow-card transition-all hover:shadow-card-hover hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <f.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="px-4 py-20">
        <div className="container mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">Featured Events</h2>
              <p className="mt-1 text-muted-foreground">Don't miss these upcoming highlights</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/events")} className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-[380px] animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : featuredEvents.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No featured events at the moment.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events with Countdown */}
      <section className="border-t bg-card px-4 py-20">
        <div className="container mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">Upcoming Events</h2>
              <p className="mt-1 text-muted-foreground">Register before it's too late!</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/events")} className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-[420px] animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="space-y-3">
                  <EventCard event={event} />
                  <CountdownTimer targetDate={event.date} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section className="px-4 py-20">
          <div className="container mx-auto">
            <div className="mb-10">
              <h2 className="font-display text-3xl font-bold text-foreground">Past Events</h2>
              <p className="mt-1 text-muted-foreground">See what you may have missed</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pastEvents.map((event) => (
                <div key={event.id} className="opacity-75">
                  <EventCard event={event} isPast />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="border-t bg-card px-4 py-20">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">What People Say</h2>
            <p className="mt-2 text-muted-foreground">Hear from our users</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-0 bg-background shadow-card">
                <CardContent className="p-6">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className={`h-4 w-4 ${si < t.rating ? "fill-accent text-accent" : "text-muted"}`} />
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="mt-2 text-muted-foreground">Got questions? We've got answers</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i} className="overflow-hidden shadow-card">
                <button
                  className="flex w-full items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-display font-semibold text-foreground">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>
                {openFaq === i && (
                  <div className="border-t px-5 pb-5 pt-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="border-t bg-card px-4 py-20">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Get In Touch</h2>
            <p className="mt-2 text-muted-foreground">Have a question or feedback? We'd love to hear from you</p>
          </div>
          <Card className="shadow-elevated">
            <CardContent className="p-8">
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <Input
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <Textarea
                    placeholder="How can we help?"
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={sendingContact}>
                  <Send className="h-4 w-4" /> {sendingContact ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-foreground px-4 py-16 text-background">
        <div className="container mx-auto">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-display text-xl font-bold">
                <Calendar className="h-6 w-6 text-primary" />
                EventHub
              </div>
              <p className="mt-4 text-sm leading-relaxed opacity-70">
                AI-Enhanced Event Management System for campus communities. Discover, register, and manage events seamlessly.
              </p>
              <div className="mt-6 flex gap-3">
                {[
                  { icon: Facebook, href: "#" },
                  { icon: Twitter, href: "#" },
                  { icon: Instagram, href: "#" },
                  { icon: Linkedin, href: "#" },
                  { icon: Youtube, href: "#" },
                ].map((s, i) => (
                  <a key={i} href={s.href} className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/10 transition-colors hover:bg-background/20">
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-display font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><a href="/events" className="hover:opacity-100">Browse Events</a></li>
                <li><a href="/auth?mode=signup" className="hover:opacity-100">Register</a></li>
                <li><a href="/auth" className="hover:opacity-100">Sign In</a></li>
                <li><a href="/dashboard" className="hover:opacity-100">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-display font-semibold">Event Types</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li>Workshops</li>
                <li>Hackathons</li>
                <li>Seminars</li>
                <li>Cultural Events</li>
                <li>Competitions</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-display font-semibold">Contact</h4>
              <ul className="space-y-3 text-sm opacity-70">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@eventhub.edu</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +1 (555) 123-4567</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> University Campus, Block A</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-background/10 pt-8 text-center text-sm opacity-50">
            <p>© 2026 EventHub. All rights reserved. Built for academic demonstration.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
