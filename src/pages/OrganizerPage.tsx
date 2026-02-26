import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const OrganizerPage = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", category: "Workshop", date: "", end_date: "",
    venue: "", total_seats: "100", image_url: "", tags: "",
  });

  useEffect(() => {
    if (!user || (!roles.includes("organizer") && !roles.includes("admin"))) {
      navigate("/");
      return;
    }
    fetchEvents();
  }, [user, roles]);

  const fetchEvents = async () => {
    let query = supabase.from("events").select("*").order("date", { ascending: false });
    if (!roles.includes("admin")) query = query.eq("organizer_id", user!.id);
    const { data } = await query;
    if (data) setEvents(data);
  };

  const fetchParticipants = async (eventId: string) => {
    setSelectedEvent(eventId);
    const { data: regs } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .neq("status", "cancelled");
    
    if (!regs || regs.length === 0) { setParticipants([]); return; }
    
    // Fetch profiles separately
    const userIds = regs.map((r: any) => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const data = regs.map((r: any) => ({ ...r, profiles: profileMap.get(r.user_id) || null }));
    if (data) setParticipants(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("events").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        end_date: formData.end_date || null,
        venue: formData.venue,
        total_seats: parseInt(formData.total_seats),
        available_seats: parseInt(formData.total_seats),
        image_url: formData.image_url || null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
        organizer_id: user!.id,
      });
      if (error) throw error;
      toast.success("Event created!");
      setShowCreateDialog(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const selectedEventData = events.find((e) => e.id === selectedEvent);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Organizer Panel</h1>
            <p className="text-muted-foreground">Manage your events and view participants</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create Event</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Workshop", "Hackathon", "Seminar", "Cultural", "Competition"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Seats</Label>
                    <Input type="number" required value={formData.total_seats} onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date & Time</Label>
                    <Input type="datetime-local" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date & Time</Label>
                    <Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Image URL (optional)</Label>
                  <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="AI, Workshop, Python" />
                </div>
                <Button type="submit">Create Event</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="mb-4 font-display text-lg font-semibold">Your Events</h2>
            <div className="space-y-3">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className={`cursor-pointer transition-all shadow-card hover:shadow-card-hover ${selectedEvent === event.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => fetchParticipants(event.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(event.date), "MMM dd")}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.total_seats - event.available_seats} / {event.total_seats}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet. Create one!</p>}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedEventData ? (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">{selectedEventData.title} — Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  {participants.length === 0 ? (
                    <p className="text-muted-foreground">No registrations yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{(p as any).profiles?.full_name || "—"}</TableCell>
                            <TableCell>{(p as any).profiles?.email || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={p.status === "confirmed" ? "default" : "secondary"}>
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(p.registered_at), "MMM dd, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select an event to view participants
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerPage;
