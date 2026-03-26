import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    venue: string;
    total_seats: number;
    available_seats: number;
    image_url: string | null;
    is_featured: boolean;
    tags: string[];
  };
  isPast?: boolean;
}

const categoryColors: Record<string, string> = {
  Workshop: "bg-primary/10 text-primary border-primary/20",
  Hackathon: "bg-destructive/10 text-destructive border-destructive/20",
  Seminar: "bg-info/10 text-info border-info/20",
  Cultural: "bg-accent/20 text-accent-foreground border-accent/30",
  Competition: "bg-success/10 text-success border-success/20",
};

const EventCard = ({ event, isPast }: EventCardProps) => {
  const navigate = useNavigate();
  const seatsPercentage = (event.available_seats / event.total_seats) * 100;
  const isFull = event.available_seats === 0;

  return (
    <Card className="group overflow-hidden border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image_url || "/placeholder.svg"}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {isPast && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
            <Badge className="bg-muted text-muted-foreground text-sm">Completed</Badge>
          </div>
        )}
        {event.is_featured && !isPast && (
          <Badge className="absolute left-3 top-3 bg-gradient-accent border-0 text-accent-foreground font-semibold">
            Featured
          </Badge>
        )}
        <Badge className={`absolute right-3 top-3 border ${categoryColors[event.category] || "bg-secondary text-secondary-foreground"}`}>
          {event.category}
        </Badge>
      </div>
      <CardContent className="p-5">
        <h3 className="mb-2 font-display text-lg font-semibold text-foreground line-clamp-1">{event.title}</h3>
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {format(new Date(event.date), "MMM dd, yyyy • h:mm a")}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {event.venue}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div className="flex flex-1 items-center gap-2">
              <span className={isFull ? "text-destructive font-medium" : ""}>
                {isFull ? "Full" : `${event.available_seats} seats left`}
              </span>
              <div className="h-1.5 flex-1 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${seatsPercentage > 50 ? "bg-success" : seatsPercentage > 20 ? "bg-warning" : "bg-destructive"}`}
                  style={{ width: `${seatsPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-5 pt-0">
        <Button className="w-full" variant={isPast ? "outline" : "default"} onClick={() => navigate(`/events/${event.id}`)}>
          {isPast ? "View Details" : "View Details"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
