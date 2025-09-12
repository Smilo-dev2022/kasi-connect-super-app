import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { EVENTS_BASE } from "@/lib/api";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  Ticket,
  Plus,
  Star,
  Music,
  Church,
  Trophy,
  Megaphone,
  Heart,
  Bell
} from "lucide-react";

const Events = () => {
  const upcomingEvents = [
    {
      id: 1,
      title: "Ward 12 Community Meeting",
      description: "Monthly community meeting to discuss local issues and developments",
      date: "Dec 15, 2024",
      time: "18:00",
      location: "Community Hall, Main Road",
      organizer: "Ward Councillor",
      attendees: 45,
      capacity: 100,
      price: 0,
      category: "community",
      icon: Megaphone,
      verified: true,
      rsvp: false,
      slug: "ward-12-meeting"
    },
    {
      id: 2,
      title: "Youth Soccer Tournament",
      description: "Annual inter-township soccer competition for ages 16-25",
      date: "Dec 18, 2024",
      time: "09:00",
      location: "Sports Ground, 5th Avenue",
      organizer: "Soweto Youth FC",
      attendees: 120,
      capacity: 200,
      price: 20,
      category: "sports",
      icon: Trophy,
      verified: true,
      rsvp: true,
      slug: "launch-party"
    },
    {
      id: 3,
      title: "Sunday Service",
      description: "Weekly community worship service with special guest speaker",
      date: "Dec 17, 2024",
      time: "09:00",
      location: "Methodist Church",
      organizer: "Pastor Mthembu",
      attendees: 85,
      capacity: 150,
      price: 0,
      category: "religious",
      icon: Church,
      verified: true,
      rsvp: false,
      slug: "sunday-service"
    },
    {
      id: 4,
      title: "Jazz & Braai Festival",
      description: "Live music, local food vendors, and community celebration",
      date: "Dec 22, 2024",
      time: "15:00",
      location: "Park Amphitheater",
      organizer: "Township Cultural Committee",
      attendees: 78,
      capacity: 300,
      price: 50,
      category: "entertainment",
      icon: Music,
      verified: true,
      rsvp: false,
      slug: "jazz-braai"
    }
  ];

  const categories = [
    { name: "All", count: 12, active: true },
    { name: "Community", count: 4, active: false },
    { name: "Sports", count: 3, active: false },
    { name: "Religious", count: 2, active: false },
    { name: "Entertainment", count: 3, active: false }
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Events" />
      
      <div className="p-4 space-y-6">
        {/* Create Event Button */}
        <Button variant="hero" className="w-full justify-center gap-2 py-6">
          <Plus className="w-5 h-5" />
          Create New Event
        </Button>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Badge
              key={category.name}
              variant={category.active ? 'default' : 'outline'}
              className="px-4 py-2 whitespace-nowrap cursor-pointer hover:bg-primary/20"
            >
              {category.name} ({category.count})
            </Badge>
          ))}
        </div>

        {/* This Week's Highlights */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 via-community/10 to-secondary/10 border-primary/20">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">This Week's Events</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">8</div>
                <div className="text-xs text-muted-foreground">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-community">3</div>
                <div className="text-xs text-muted-foreground">Free Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">328</div>
                <div className="text-xs text-muted-foreground">Total RSVPs</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Upcoming Events */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            {upcomingEvents.map((event) => {
              const eventColor = getEventColor(event.category);
              const colorClasses = getColorClasses(eventColor);
              
              return (
                <Card key={event.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex gap-4">
                    {/* Event Icon */}
                    <div className={`w-16 h-16 rounded-2xl ${colorClasses} flex items-center justify-center border-2 flex-shrink-0`}>
                      <event.icon className="w-8 h-8" />
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{event.title}</h4>
                            {event.verified && (
                              <div className="p-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                                <Star className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                        </div>
                        {event.rsvp && (
                          <Badge className="bg-community text-community-foreground ml-2">
                            RSVP'd
                          </Badge>
                        )}
                      </div>

                      {/* Event Meta Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {event.date} at {event.time}
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

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          variant={event.rsvp ? "outline" : "community"} 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            if (event.slug) {
                              window.open(`${EVENTS_BASE}/events/${event.slug}`, '_blank');
                            }
                          }}
                        >
                          {event.rsvp ? "Cancel RSVP" : "RSVP"}
                        </Button>
                        {event.price > 0 && (
                          <Button variant="outline" size="sm">
                            <Ticket className="w-4 h-4 mr-2" />
                            Buy Ticket
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Community Calendar CTA */}
        <Card className="p-6 bg-gradient-to-r from-community/20 to-primary/20 border-community/30 text-center">
          <Heart className="w-12 h-12 text-community mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Never Miss Community Events</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get notified about events happening in your area and connect with your neighbors
          </p>
          <Button variant="community" className="gap-2">
            <Bell className="w-4 h-4" />
            Enable Event Notifications
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Events;