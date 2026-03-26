import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = roles.includes("admin");
  const isOrganizer = roles.includes("organizer");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = [
    { label: "Events", href: "/events", show: true },
    { label: "Dashboard", href: "/dashboard", show: !!user },
    { label: "Organizer", href: "/organizer", show: isAdmin || isOrganizer },
    { label: "Admin", href: "/admin", show: isAdmin },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <Calendar className="h-6 w-6 text-primary" />
          EventHub
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.filter((l) => l.show).map((l) => (
            <Link key={l.href} to={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{profile?.full_name || user.email}</span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
              <Button onClick={() => navigate("/auth?mode=signup")}>Sign Up</Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden animate-fade-in">
          <div className="flex flex-col gap-3">
            {navLinks.filter((l) => l.show).map((l) => (
              <Link key={l.href} to={l.href} className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button variant="ghost" onClick={handleSignOut} className="justify-start">Sign Out</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Sign In</Button>
                <Button onClick={() => { navigate("/auth?mode=signup"); setMobileOpen(false); }}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
