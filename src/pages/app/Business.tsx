import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { 
  Store, 
  ShoppingBag, 
  Scissors, 
  Car,
  Coffee,
  Wrench,
  Star,
  MapPin,
  Clock,
  Phone,
  Plus,
  Search,
  Filter,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Business = () => {
  const businessCategories = [
    { name: "All", count: 45, active: true },
    { name: "Spaza Shops", count: 12, active: false },
    { name: "Salons", count: 8, active: false },
    { name: "Taxis", count: 15, active: false },
    { name: "Repairs", count: 6, active: false },
    { name: "Food", count: 4, active: false }
  ];

  const localBusinesses = [
    {
      id: 1,
      name: "Mama Khoza's Spaza",
      category: "Grocery",
      description: "Fresh groceries, airtime, and household essentials",
      rating: 4.8,
      reviews: 124,
      distance: "0.2km",
      openHours: "06:00 - 22:00",
      phone: "078 123 4567",
      verified: true,
      online: true,
      icon: Store,
      specialOffers: ["10% off bulk purchases", "Free delivery over R200"]
    },
    {
      id: 2,
      name: "Elegant Hair Studio",
      category: "Beauty",
      description: "Hair styling, braids, treatments, and beauty services",
      rating: 4.9,
      reviews: 89,
      distance: "0.5km",
      openHours: "08:00 - 18:00",
      phone: "082 456 7890",
      verified: true,
      online: false,
      icon: Scissors,
      specialOffers: ["Student discount 15%", "Loyalty card available"]
    },
    {
      id: 3,
      name: "Thabo's Taxi Service",
      category: "Transport",
      description: "Reliable taxi service to CBD, Sandton, and surrounding areas",
      rating: 4.6,
      reviews: 203,
      distance: "0.1km",
      openHours: "05:00 - 22:00",
      phone: "071 789 0123",
      verified: true,
      online: true,
      icon: Car,
      specialOffers: ["Monthly pass available", "Group booking discounts"]
    },
    {
      id: 4,
      name: "Fix-It-Right Repairs",
      category: "Services",
      description: "Electronics, appliances, and gadget repair services",
      rating: 4.7,
      reviews: 67,
      distance: "0.8km",
      openHours: "08:00 - 17:00",
      phone: "084 234 5678",
      verified: true,
      online: false,
      icon: Wrench,
      specialOffers: ["Free diagnosis", "30-day warranty on repairs"]
    },
    {
      id: 5,
      name: "Corner Café & Takeaways",
      category: "Food",
      description: "Fresh meals, snacks, and beverages for takeaway",
      rating: 4.5,
      reviews: 156,
      distance: "0.3km",
      openHours: "07:00 - 21:00",
      phone: "079 345 6789",
      verified: false,
      online: true,
      icon: Coffee,
      specialOffers: ["Lunch special R35", "Buy 5 get 1 free coffee"]
    }
  ];

  const getBusinessColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'grocery': return 'community';
      case 'beauty': return 'primary';
      case 'transport': return 'secondary';
      case 'services': return 'community';
      case 'food': return 'destructive';
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

  const navigate = useNavigate();

  const startOrder = (businessId: number, businessName: string) => {
    const to = `biz-${businessId}`;
    const offer = {
      kind: 'order_offer',
      title: `New order for ${businessName}`,
      items: [
        { name: 'Custom item', qty: 1, price: 50 },
      ],
      currency: 'ZAR',
    };
    const payload = encodeURIComponent(JSON.stringify(offer));
    navigate(`/app/chats/${to}?prefill=${payload}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Local Business" />
      
      <div className="p-4 space-y-6">
        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search businesses..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground"
            />
          </div>
          <Button variant="outline" size="icon" className="w-12 h-12">
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Add Business Button */}
        <Button variant="hero" className="w-full justify-center gap-2 py-6">
          <Plus className="w-5 h-5" />
          Register Your Business
        </Button>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {businessCategories.map((category) => (
            <Badge
              key={category.name}
              variant={category.active ? 'default' : 'outline'}
              className="px-4 py-2 whitespace-nowrap cursor-pointer hover:bg-primary/20"
            >
              {category.name} ({category.count})
            </Badge>
          ))}
        </div>

        {/* Business Stats */}
        <Card className="p-6 bg-gradient-to-r from-community/10 via-primary/10 to-secondary/10 border-community/20">
          <div className="text-center">
            <Store className="w-12 h-12 text-community mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-4">Supporting Local Economy</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-community">45</div>
                <div className="text-xs text-muted-foreground">Local Businesses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">32</div>
                <div className="text-xs text-muted-foreground">Verified Shops</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">89%</div>
                <div className="text-xs text-muted-foreground">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Local Businesses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Nearby Businesses</h3>
            <Button variant="ghost" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </Button>
          </div>
          
          <div className="space-y-4">
            {localBusinesses.map((business) => {
              const businessColor = getBusinessColor(business.category);
              const colorClasses = getColorClasses(businessColor);
              
              return (
                <Card key={business.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex gap-4">
                    {/* Business Icon */}
                    <div className={`w-16 h-16 rounded-2xl ${colorClasses} flex items-center justify-center border-2 flex-shrink-0`}>
                      <business.icon className="w-8 h-8" />
                    </div>

                    {/* Business Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{business.name}</h4>
                            {business.verified && (
                              <div className="p-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                                <Star className="w-3 h-3" />
                              </div>
                            )}
                            {business.online && (
                              <div className="w-2 h-2 bg-community rounded-full" />
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs mb-2">{business.category}</Badge>
                          <p className="text-sm text-muted-foreground mb-2">{business.description}</p>
                        </div>
                      </div>

                      {/* Business Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {business.rating} ({business.reviews} reviews)
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {business.distance} away
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {business.openHours}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {business.phone}
                        </div>
                      </div>

                      {/* Special Offers */}
                      {business.specialOffers.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-community mb-1">Special Offers:</div>
                          <div className="flex flex-wrap gap-1">
                            {business.specialOffers.map((offer, index) => (
                              <Badge key={index} variant="outline" className="text-xs text-community border-community/30">
                                {offer}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button variant="community" size="sm" className="flex-1" onClick={() => startOrder(business.id, business.name)}>
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Order Now
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Business;