import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(168, 80%, 36%)", "hsl(38, 92%, 55%)", "hsl(210, 90%, 52%)", "hsl(0, 72%, 51%)", "hsl(152, 69%, 40%)"];

const AdminPage = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalEvents: 0, totalRegistrations: 0, attendanceRate: 0 });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [popularEvents, setPopularEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !roles.includes("admin")) {
      navigate("/");
      return;
    }
    fetchStats();
  }, [user, roles]);

  const fetchStats = async () => {
    const [{ count: userCount }, { count: eventCount }, { count: regCount }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("registrations").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    ]);

    const totalSeats = (await supabase.from("events").select("total_seats")).data?.reduce((a: number, e: any) => a + e.total_seats, 0) || 1;
    const rate = Math.round(((regCount || 0) / totalSeats) * 100);

    setStats({ totalUsers: userCount || 0, totalEvents: eventCount || 0, totalRegistrations: regCount || 0, attendanceRate: rate });

    // Category distribution
    const { data: events } = await supabase.from("events").select("category, total_seats, available_seats");
    if (events) {
      const catMap: Record<string, number> = {};
      events.forEach((e: any) => { catMap[e.category] = (catMap[e.category] || 0) + 1; });
      setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));
    }

    // Popular events
    const { data: regs } = await supabase.from("registrations").select("event_id, events(title, category)").eq("status", "confirmed");
    if (regs) {
      const eventMap: Record<string, { title: string; count: number; category: string }> = {};
      regs.forEach((r: any) => {
        const eid = r.event_id;
        if (!eventMap[eid]) eventMap[eid] = { title: r.events?.title || "", count: 0, category: r.events?.category || "" };
        eventMap[eid].count++;
      });
      setPopularEvents(Object.values(eventMap).sort((a, b) => b.count - a.count).slice(0, 5));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 font-display text-3xl font-bold">Admin Dashboard</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
            { label: "Total Events", value: stats.totalEvents, icon: Calendar, color: "text-info" },
            { label: "Registrations", value: stats.totalRegistrations, icon: TrendingUp, color: "text-success" },
            { label: "Attendance Rate", value: `${stats.attendanceRate}%`, icon: BarChart3, color: "text-accent" },
          ].map((s) => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold font-display">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Events by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Popular Events</CardTitle>
            </CardHeader>
            <CardContent>
              {popularEvents.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={popularEvents} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(168, 80%, 36%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center text-muted-foreground">No registrations yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
