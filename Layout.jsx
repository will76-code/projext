import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Home, Book, Users, Map, User, Settings } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: "WorldHub", label: "Worlds", icon: Home },
    { name: "RulebookManager", label: "Rulebooks", icon: Book },
    { name: "CampaignManager", label: "Campaigns", icon: Map },
    { name: "UniversalCharacterBuilder", label: "Characters", icon: Users },
    { name: "UserProfile", label: "Profile", icon: User }
  ];

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-purple-500/30 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
              <span className="text-xl font-bold text-white">Multiverse Quest</span>
            </div>
            
            <div className="flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPageName === item.name;
                return (
                  <Link key={item.name} to={createPageUrl(item.name)}>
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}>
                      <Icon className="w-4 h-4" />
                      <span className="hidden md:inline text-sm">{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}