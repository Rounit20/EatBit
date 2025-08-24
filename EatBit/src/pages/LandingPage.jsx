import React, { useState, useEffect } from "react";
import { ChefHat, Clock, Star, MapPin, Smartphone, ArrowRight, Play, Shield, Truck, Users, Award, Globe, Utensils } from "lucide-react";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const navigate = (path) => {
    // Using window.location for navigation
    window.location.href = path;
  };

  const features = [
    { 
      icon: Clock, 
      title: "Lightning Fast Delivery", 
      desc: "Average delivery time of just 15 minutes with real-time tracking",
      stat: "15min"
    },
    { 
      icon: Shield, 
      title: "Premium Quality", 
      desc: "Partner with top-rated restaurants ensuring quality and freshness",
      stat: "4.9★"
    },
    { 
      icon: Truck, 
      title: "Live Order Tracking", 
      desc: "Real-time GPS tracking from kitchen to your doorstep",
      stat: "24/7"
    }
  ];

  const cuisines = [
    { name: "Italian Classics", icon: "🍝", description: "Authentic pasta & pizza" },
    { name: "Asian Fusion", icon: "🍜", description: "Fresh sushi & noodles" },
    { name: "Mexican Delights", icon: "🌮", description: "Tacos & burritos" },
    { name: "Sweet Desserts", icon: "🍰", description: "Cakes & pastries" },
    { name: "American Favorites", icon: "🍔", description: "Burgers & fries" },
    { name: "Healthy Options", icon: "🥗", description: "Fresh salads & bowls" }
  ];

  const stats = [
    { number: "500+", label: "Partner Restaurants", icon: Utensils },
    { number: "50K+", label: "Happy Customers", icon: Users },
    { number: "4.9/5", label: "Average Rating", icon: Star },
    { number: "15min", label: "Delivery Time", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900 font-sans relative overflow-x-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">EatBit</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-orange-600 transition-colors">Restaurants</a>
            <a href="#" className="hover:text-orange-600 transition-colors">About</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Support</a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/login")}
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate("/signup")}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-6 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Content */}
            <div className={`flex flex-col gap-8 transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'
            }`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 text-sm w-fit text-orange-700">
                <Award className="w-4 h-4" />
                <span className="font-medium">Rated #1 Food Delivery App</span>
              </div>

              {/* Main Heading */}
              <div>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-gray-900">
                  Restaurant Quality,
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    {" "}Delivered Fast
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Experience premium food delivery with our curated selection of top-rated restaurants. 
                  Fresh meals delivered to your doorstep in minutes.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  <span>Start Ordering</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  className="bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-300"
                >
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">4.9/5 from 50K+ reviews</span>
                </div>
              </div>
            </div>

            {/* Hero Visual - Enhanced Phone Mockup */}
            <div className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
            } flex justify-center lg:justify-end`}>
              <div className="relative w-80 h-96">
                {/* Main Phone Mockup */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-2 shadow-2xl hover:shadow-3xl transition-all duration-500 z-10">
                  <div className="w-full h-full bg-white rounded-2xl p-1 overflow-hidden">
                    {/* Phone Screen Content */}
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 flex flex-col relative">
                      {/* Status Bar */}
                      <div className="flex items-center justify-between text-white text-xs mb-4">
                        <span>9:41 AM</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* App Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-white font-bold text-lg">Good Morning!</h3>
                          <p className="text-white/80 text-sm">What would you like to eat?</p>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-6">
                        <div className="text-white/80 text-sm">Search restaurants...</div>
                      </div>
                      
                      {/* Categories */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                          <div className="text-2xl mb-2">🍕</div>
                          <div className="text-white text-xs font-medium">Italian</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                          <div className="text-2xl mb-2">🍔</div>
                          <div className="text-white text-xs font-medium">Burgers</div>
                        </div>
                      </div>

                      {/* Order Status */}
                      <div className="bg-white/90 rounded-xl p-4 mt-auto">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                          <div>
                            <div className="text-gray-900 font-semibold text-sm">Order Confirmed!</div>
                            <div className="text-gray-600 text-xs">Estimated delivery: 15 mins</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center animate-float">
                  <span className="text-2xl">🍕</span>
                </div>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
                  <span className="text-2xl">🍔</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 px-6 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Why Choose <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">EatBit?</span>
            </h2>  
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've revolutionized food delivery with cutting-edge technology, premium partnerships, 
              and an unwavering commitment to quality service.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-white border border-gray-200 rounded-2xl p-8 transition-all duration-500 cursor-pointer hover:shadow-xl hover:border-orange-200 group ${
                  activeFeature === index ? 'border-orange-400 shadow-lg transform scale-[1.02]' : ''
                }`}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-4">{feature.desc}</p>
                <div className="text-2xl font-bold text-orange-500">{feature.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cuisines Section */}
      <div className="relative z-10 px-6 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Explore <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Cuisines</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From local favorites to international delicacies, discover a world of flavors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cuisines.map((cuisine, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {cuisine.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{cuisine.name}</h3>
                <p className="text-gray-600">{cuisine.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partner Section */}
      <div className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Trusted by Leading Restaurants
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["Restaurant A", "Bistro B", "Cafe C", "Grill D", "Kitchen E"].map((name, index) => (
              <div key={index} className="bg-gray-100 px-6 py-3 rounded-lg text-gray-700 font-medium">
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 px-6 py-24 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied customers and experience premium food delivery today. 
            Your next great meal is just a few taps away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate("/signup")}
              className="bg-white text-orange-600 px-12 py-4 rounded-xl font-bold text-xl hover:bg-gray-50 transform hover:scale-[1.02] transition-all duration-300"
            >
              Start Ordering Now
            </button>
            <button 
              onClick={() => navigate("/outlet-signup")}
              className="border-2 border-white text-white px-12 py-4 rounded-xl font-bold text-xl hover:bg-white hover:text-orange-600 transition-all duration-300"
            >
              Join as Restaurant
            </button>
          </div>
          
          <div className="mt-8 flex justify-center gap-8 text-sm opacity-80">
            <span>✓ Free to join</span>
            <span>✓ No monthly fees</span>
            <span>✓ 24/7 support</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">EatBit</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Premium food delivery service connecting you with the best restaurants in your area.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#" onClick={() => navigate("/login")} className="hover:text-white transition-colors">Sign In</a></div>
                <div><a href="#" onClick={() => navigate("/signup")} className="hover:text-white transition-colors">Sign Up</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Track Order</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Help Center</a></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Restaurants</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#" onClick={() => navigate("/outlet-login")} className="hover:text-white transition-colors">Partner Login</a></div>
                <div><a href="#" onClick={() => navigate("/outlet-signup")} className="hover:text-white transition-colors">Join as Partner</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Partner Resources</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Contact Sales</a></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#" className="hover:text-white transition-colors">About Us</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Careers</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Press</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Contact</a></div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div>© 2025 EatBit. All rights reserved.</div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;