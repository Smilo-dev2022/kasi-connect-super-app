import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listTickets, getEventById } from "@/services/events";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Ticket } from "lucide-react";

const Tickets = () => {
  const tickets = useMemo(() => listTickets(), []);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="My Tickets" />
      <div className="p-4 space-y-4">
        {tickets.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-muted-foreground mb-4">No tickets yet.</div>
            <Button onClick={() => navigate("/app/events")}>Browse Events</Button>
          </Card>
        ) : (
          tickets.map((t) => {
            const event = getEventById(t.eventId);
            if (!event) return null;
            return (
              <Card key={t.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{event.title}</div>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {event.dateLabel} at {event.timeLabel}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline">Status: {t.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/app/tickets/${t.id}`)}>
                      <Ticket className="w-4 h-4 mr-2" />
                      View QR
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Tickets;

