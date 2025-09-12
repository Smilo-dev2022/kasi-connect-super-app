import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Ticket, Star, Megaphone, Trophy, Church, Music } from "lucide-react";
import { getEventById, toggleRsvp, createTicket } from "@/services/events";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = useMemo(() => (eventId ? getEventById(eventId) : undefined), [eventId]);

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
        <AppHeader title="Event" />
        <div className="p-4">
          <Card className="p-6 text-center">Event not found</Card>
        </div>
      </div>
    );
  }

  const getEventColor = (category: string) => {
    switch (category) {
      case 'community': return 'primary';
      case 'sports': return 'community';
      case 'religious': return 'secondary';
      case 'entertainment': return 'destructive';
      default: return 'primary';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary': return 'text-primary bg-primary/10 border-primary/20';
      case 'community': return 'text-community bg-community/10 border-community/20';
      case 'secondary': return 'text-secondary bg-secondary/10 border-secondary/20';
      case 'destructive': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const eventColor = getEventColor(event.category);
  const colorClasses = getColorClasses(eventColor);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Event Details" />
      <div className="p-4 space-y-4">
        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className={`w-16 h-16 rounded-2xl ${colorClasses} flex items-center justify-center border-2 flex-shrink-0`}>
              {event.category === 'community' && <Megaphone className="w-8 h-8" />}
              {event.category === 'sports' && <Trophy className="w-8 h-8" />}
              {event.category === 'religious' && <Church className="w-8 h-8" />}
              {event.category === 'entertainment' && <Music className="w-8 h-8" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold text-foreground">{event.title}</h2>
                    {event.verified && (
                      <div className="p-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                        <Star className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {event.dateLabel} at {event.timeLabel}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.attendees}/{event.capacity} attending
                </div>
                <div className="flex items-center gap-1">
                  <Ticket className="w-3 h-3" />
                  {event.price === 0 ? 'Free' : `R${event.price}`}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={event.rsvp ? "outline" : "community"}
                  onClick={() => {
                    const next = toggleRsvp(event.id);
                    // Soft refresh by navigating to same route to re-read from storage
                    if (next !== event.rsvp) {
                      navigate(0);
                    }
                  }}
                >
                  {event.rsvp ? "Cancel RSVP" : "RSVP"}
                </Button>
                {event.price > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const ticket = createTicket(event.id);
                      navigate(`/app/tickets/${ticket.id}`);
                    }}
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Buy Ticket
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate("/app/tickets")}>My Tickets</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EventDetails;

