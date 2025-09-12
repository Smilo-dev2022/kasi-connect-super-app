import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTicketById, getEventById } from "@/services/events";
import QRCode from "react-qr-code";

const TicketView = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const ticket = useMemo(() => (ticketId ? getTicketById(ticketId) : undefined), [ticketId]);
  const event = useMemo(() => (ticket ? getEventById(ticket.eventId) : undefined), [ticket]);

  if (!ticket || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
        <AppHeader title="Ticket" />
        <div className="p-4">
          <Card className="p-6 text-center">Ticket not found</Card>
        </div>
      </div>
    );
  }

  const qrPayload = JSON.stringify({ v: 1, ticketId: ticket.id, eventId: event.id });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Ticket" />
      <div className="p-4 space-y-4">
        <Card className="p-6 text-center bg-card/80 backdrop-blur-sm">
          <div className="text-foreground font-semibold mb-2">{event.title}</div>
          <div className="text-sm text-muted-foreground mb-6">{event.dateLabel} at {event.timeLabel} • {event.location}</div>
          <div className="mx-auto w-[220px] h-[220px] bg-white p-4 rounded-lg shadow-inner">
            <QRCode value={qrPayload} size={180} style={{ width: "100%", height: "100%" }} />
          </div>
          <div className="mt-4">
            <Badge variant="outline">{ticket.status.toUpperCase()}</Badge>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/app/tickets")}>My Tickets</Button>
            <Button variant="outline" onClick={() => navigate(`/app/events/${event.id}`)}>Event Details</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TicketView;

