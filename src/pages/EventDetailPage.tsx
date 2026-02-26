import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Tag } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const EventDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [existingReg, setExistingReg] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("events").select("*").eq("id", id).single();
      if (data) setEvent(data);

      if (user) {
        const { data: reg } = await supabase
          .from("registrations")
          .select("*")
          .eq("event_id", id)
          .eq("user_id", user.id)
          .neq("status", "cancelled")
          .maybeSingle();
        setExistingReg(reg);
      }
      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setRegistering(true);
    try {
      const { data, error } = await supabase.rpc("register_for_event", {
        p_event_id: id,
        p_user_id: user.id,
      });
      if (error) throw error;
      const result = data as any;
      if (result.error) {
        toast.error(result.error);
      } else {
        setExistingReg({ status: result.status, qr_code: result.qr_code, id: result.id });
        if (result.status === "confirmed") {
          toast.success("Successfully registered! Check your dashboard for the QR code.");
        } else {
          toast.info("Event is full. You've been added to the waitlist.");
        }
        // Refresh event data
        const { data: updated } = await supabase.from("events").select("*").eq("id", id).single();
        if (updated) setEvent(updated);
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Event not found.</p>
          <Button className="mt-4" onClick={() => navigate("/events")}>Back to Events</Button>
        </div>
      </div>
    );
  }

  const seatsPercent = (event.available_seats / event.total_seats) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/events")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 animate-fade-in">
            <div className="overflow-hidden rounded-xl">
              <img src={event.image_url || "/placeholder.svg"} alt={event.title} className="h-64 w-full object-cover sm:h-80" />
            </div>
            <div className="mt-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{event.category}</Badge>
                {event.is_featured && <Badge className="bg-gradient-accent border-0 text-accent-foreground">Featured</Badge>}
              </div>
              <h1 className="mb-4 font-display text-3xl font-bold text-foreground">{event.title}</h1>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>

              {event.tags && event.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {event.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      <Tag className="h-3 w-3" /> {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="animate-slide-in">
            <Card className="sticky top-24 shadow-elevated">
              <CardContent className="p-6">
                <div className="mb-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{format(new Date(event.date), "EEEE, MMMM dd, yyyy")}</p>
                      <p className="text-muted-foreground">{format(new Date(event.date), "h:mm a")}{event.end_date && ` - ${format(new Date(event.end_date), "h:mm a")}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{event.available_seats} / {event.total_seats} seats available</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${seatsPercent > 50 ? "bg-success" : seatsPercent > 20 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${seatsPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {existingReg ? (
                  <div className="text-center">
                    <Badge className={existingReg.status === "confirmed" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                      {existingReg.status === "confirmed" ? "✓ Registered" : "⏳ Waitlisted"}
                    </Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {existingReg.status === "confirmed" ? "View your QR code in the dashboard" : "You'll be notified when a seat opens"}
                    </p>
                    <Button className="mt-4 w-full" variant="outline" onClick={() => navigate("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" size="lg" onClick={handleRegister} disabled={registering}>
                    {registering ? "Registering..." : event.available_seats === 0 ? "Join Waitlist" : "Register Now"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
