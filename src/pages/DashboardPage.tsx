import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Sparkles, Loader2, User, Save } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DashboardPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [editProfile, setEditProfile] = useState({ full_name: "", interests: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchRegistrations();
    if (profile) {
      setEditProfile({
        full_name: profile.full_name || "",
        interests: (profile.interests || []).join(", "),
      });
    }
  }, [user, profile]);

  const fetchRegistrations = async () => {
    const { data } = await supabase
      .from("registrations")
      .select("*, events(*)")
      .eq("user_id", user!.id)
      .neq("status", "cancelled")
      .order("registered_at", { ascending: false });
    if (data) setRegistrations(data);
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-events", {
        body: { userId: user!.id },
      });
      if (error) throw error;
      if (data?.recommendations) setRecommendations(data.recommendations);
    } catch {
      toast.error("Failed to get recommendations");
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleCancel = async (regId: string) => {
    try {
      const { data, error } = await supabase.rpc("cancel_registration", {
        p_reg_id: regId,
        p_user_id: user!.id,
      });
      if (error) throw error;
      toast.success("Registration cancelled");
      fetchRegistrations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const interests = editProfile.interests.split(",").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editProfile.full_name, interests })
        .eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const confirmed = registrations.filter((r) => r.status === "confirmed");
  const waitlisted = registrations.filter((r) => r.status === "waitlisted");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome, {profile?.full_name || "there"}! 👋
          </h1>
          <p className="text-muted-foreground">Manage your event registrations and profile</p>
        </div>

        <Tabs defaultValue="registered" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="registered">My Events ({confirmed.length})</TabsTrigger>
            <TabsTrigger value="waitlisted">Waitlisted ({waitlisted.length})</TabsTrigger>
            <TabsTrigger value="recommendations" onClick={fetchRecommendations}>AI Recommendations</TabsTrigger>
            <TabsTrigger value="profile">Edit Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="registered">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />)}
              </div>
            ) : confirmed.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <p className="text-muted-foreground">You haven't registered for any events yet.</p>
                  <Button className="mt-4" onClick={() => navigate("/events")}>Browse Events</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {confirmed.map((reg) => (
                  <Card key={reg.id} className="shadow-card animate-fade-in">
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <h3 className="font-display font-semibold text-foreground">{reg.events?.title}</h3>
                          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5" />
                              {reg.events?.date && format(new Date(reg.events.date), "MMM dd, yyyy • h:mm a")}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              {reg.events?.venue}
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Badge className="bg-success/10 text-success border-success/20">Confirmed</Badge>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancel(reg.id)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="rounded-lg border bg-card p-2">
                            <QRCodeSVG value={reg.qr_code || reg.id} size={80} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">Entry QR</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="waitlisted">
            {waitlisted.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <p className="text-muted-foreground">No waitlisted events.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {waitlisted.map((reg) => (
                  <Card key={reg.id} className="shadow-card animate-fade-in">
                    <CardContent className="p-5">
                      <h3 className="font-display font-semibold">{reg.events?.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {reg.events?.date && format(new Date(reg.events.date), "MMM dd, yyyy")}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge className="bg-warning/10 text-warning border-warning/20">Waitlisted</Badge>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancel(reg.id)}>
                          Leave Waitlist
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Event Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRecs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Analyzing your interests...</span>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Click the tab to get personalized event recommendations!</p>
                    <Button className="mt-4" onClick={fetchRecommendations}>Get Recommendations</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg border p-4 animate-fade-in">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          {rec.eventId && (
                            <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={() => navigate(`/events/${rec.eventId}`)}>
                              View Event →
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="max-w-lg shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <User className="h-5 w-5 text-primary" />
                  Edit Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={editProfile.full_name}
                    onChange={(e) => setEditProfile((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests (comma-separated)</Label>
                  <Input
                    id="interests"
                    value={editProfile.interests}
                    onChange={(e) => setEditProfile((p) => ({ ...p, interests: e.target.value }))}
                    placeholder="e.g. AI, Web Development, Design"
                  />
                  <p className="text-xs text-muted-foreground">Used for AI event recommendations</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                  <Save className="h-4 w-4" /> {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
