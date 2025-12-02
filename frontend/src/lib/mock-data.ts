/**
 * Mock data for frontend development and testing
 * Use this when the backend is not available
 */

export const mockUsers = [
  {
    id: 1,
    email: "admin@njstars.com",
    full_name: "John Coach",
    role: "admin",
  },
  {
    id: 2,
    email: "parent1@example.com",
    full_name: "Sarah Johnson",
    role: "parent",
  },
  {
    id: 3,
    email: "player1@example.com",
    full_name: "Marcus Thompson",
    role: "player",
  },
]

export const mockBlogPosts = [
  {
    id: 1,
    type: "blog",
    title: "NJ Stars Win Championship Finals!",
    content: "In an electrifying finish, the NJ Stars dominated the championship finals with a decisive 78-65 victory. Marcus Thompson led the team with 24 points and 8 rebounds, while Jordan Davis added 18 points.",
    excerpt: "NJ Stars claim another championship title with dominant performance in the finals.",
    image_url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
    author: "Coach John",
    published_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: "blog",
    title: "Summer Training Camp Registration Open",
    content: "We're excited to announce that registration is now open for our annual Summer Training Camp! This intensive 2-week program runs from July 10-21.",
    excerpt: "Join us for two weeks of intensive basketball training this summer.",
    image_url: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800",
    author: "Coach Sarah",
    published_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: "blog",
    title: "Player Spotlight: Marcus Thompson",
    content: "This month's player spotlight shines on Marcus Thompson, our star point guard. Marcus has been with NJ Stars for three years and has shown tremendous growth.",
    excerpt: "Meet Marcus Thompson, our standout point guard making waves on and off the court.",
    image_url: "https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=800",
    author: "Coach John",
    published_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockInstagramPosts = [
  {
    id: "ig_1",
    type: "instagram",
    title: "Championship win! NJ Stars dominate the finals...",
    content: "🏀 Championship win! NJ Stars dominate the finals. #NJStars #Basketball",
    image_url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
    published_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    permalink: "https://instagram.com/p/mock1",
    media_type: "IMAGE",
  },
  {
    id: "ig_2",
    type: "instagram",
    title: "Team practice highlights 💪 Getting ready...",
    content: "Team practice highlights 💪 Getting ready for the big game!",
    image_url: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800",
    published_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    permalink: "https://instagram.com/p/mock2",
    media_type: "IMAGE",
  },
]

export const mockProducts = [
  {
    id: 1,
    name: "NJ Stars Game Jersey - Home",
    description: "Official NJ Stars home game jersey. Premium moisture-wicking fabric with embroidered team logo.",
    price: 59.99,
    image_url: "https://images.unsplash.com/photo-1515965885361-f1e0095517ea?w=800",
    stock_quantity: 50,
    category: "Jersey",
  },
  {
    id: 2,
    name: "NJ Stars Game Jersey - Away",
    description: "Official NJ Stars away game jersey. High-performance fabric designed for maximum comfort.",
    price: 59.99,
    image_url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
    stock_quantity: 45,
    category: "Jersey",
  },
  {
    id: 3,
    name: "NJ Stars Practice T-Shirt",
    description: "Comfortable cotton-blend practice tee with screen-printed NJ Stars logo.",
    price: 24.99,
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    stock_quantity: 100,
    category: "T-Shirt",
  },
  {
    id: 4,
    name: "NJ Stars Hoodie",
    description: "Warm and comfortable pullover hoodie with embroidered team logo.",
    price: 49.99,
    image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
    stock_quantity: 60,
    category: "Apparel",
  },
  {
    id: 5,
    name: "NJ Stars Basketball Shorts",
    description: "Professional-grade basketball shorts with moisture-wicking technology.",
    price: 34.99,
    image_url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
    stock_quantity: 75,
    category: "Shorts",
  },
  {
    id: 6,
    name: "NJ Stars Snapback Hat",
    description: "Classic snapback cap with embroidered NJ Stars logo.",
    price: 27.99,
    image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800",
    stock_quantity: 80,
    category: "Accessories",
  },
  {
    id: 7,
    name: "NJ Stars Water Bottle",
    description: "32oz insulated stainless steel water bottle. Features laser-engraved team logo.",
    price: 19.99,
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800",
    stock_quantity: 120,
    category: "Accessories",
  },
  {
    id: 8,
    name: "NJ Stars Backpack",
    description: "Durable sports backpack with multiple compartments and padded laptop sleeve.",
    price: 44.99,
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    stock_quantity: 40,
    category: "Accessories",
  },
]

export const mockEvents = [
  {
    id: 1,
    title: "Open Gym - All Ages",
    description: "Open gym session for all skill levels. Come work on your game in a friendly environment.",
    event_type: "open_gym",
    start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000).toISOString(),
    location: "Premier Sports Complex, Newark, NJ",
    max_participants: 30,
  },
  {
    id: 2,
    title: "U16 Team Tryouts",
    description: "Tryouts for the U16 NJ Stars competitive team. Registration required.",
    event_type: "tryout",
    start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
    location: "Premier Sports Complex, Newark, NJ",
    max_participants: 50,
  },
  {
    id: 3,
    title: "Game vs. Jersey Shore Elite",
    description: "Home game against Jersey Shore Elite. Come support the team!",
    event_type: "game",
    start_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000).toISOString(),
    location: "Premier Sports Complex, Newark, NJ",
    max_participants: null,
  },
  {
    id: 4,
    title: "Atlantic City Summer Showcase",
    description: "Three-day tournament featuring top AAU teams from the region.",
    event_type: "tournament",
    start_time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(),
    location: "Atlantic City Convention Center, Atlantic City, NJ",
    max_participants: null,
  },
  {
    id: 5,
    title: "U14 Team Tryouts",
    description: "Competitive tryouts for U14 age division. Bring a positive attitude!",
    event_type: "tryout",
    start_time: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
    location: "Premier Sports Complex, Newark, NJ",
    max_participants: 50,
  },
]

export const mockUnifiedFeed = [...mockBlogPosts, ...mockInstagramPosts].sort(
  (a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
)

// Helper function to get mock data
export function useMockData<T>(data: T): T {
  return data
}
