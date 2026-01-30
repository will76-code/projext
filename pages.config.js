/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistantDashboard from './pages/AIAssistantDashboard';
import Campaign from './pages/Campaign';
import CampaignHistory from './pages/CampaignHistory';
import CampaignManager from './pages/CampaignManager';
import CharacterBuilder from './pages/CharacterBuilder';
import CharacterSelect from './pages/CharacterSelect';
import CollaborativeCampaignHub from './pages/CollaborativeCampaignHub';
import DeploymentGuide from './pages/DeploymentGuide';
import FoundryModuleSpec from './pages/FoundryModuleSpec';
import GMWorldManagement from './pages/GMWorldManagement';
import LoreEntryManager from './pages/LoreEntryManager';
import PlayerCharacterHub from './pages/PlayerCharacterHub';
import PlayerDashboard from './pages/PlayerDashboard';
import RulebookManager from './pages/RulebookManager';
import ThemeGallery from './pages/ThemeGallery';
import UniversalCharacterBuilder from './pages/UniversalCharacterBuilder';
import UserProfile from './pages/UserProfile';
import VectorStoreGuide from './pages/VectorStoreGuide';
import WorldHub from './pages/WorldHub';
import WorldHubSettings from './pages/WorldHubSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistantDashboard": AIAssistantDashboard,
    "Campaign": Campaign,
    "CampaignHistory": CampaignHistory,
    "CampaignManager": CampaignManager,
    "CharacterBuilder": CharacterBuilder,
    "CharacterSelect": CharacterSelect,
    "CollaborativeCampaignHub": CollaborativeCampaignHub,
    "DeploymentGuide": DeploymentGuide,
    "FoundryModuleSpec": FoundryModuleSpec,
    "GMWorldManagement": GMWorldManagement,
    "LoreEntryManager": LoreEntryManager,
    "PlayerCharacterHub": PlayerCharacterHub,
    "PlayerDashboard": PlayerDashboard,
    "RulebookManager": RulebookManager,
    "ThemeGallery": ThemeGallery,
    "UniversalCharacterBuilder": UniversalCharacterBuilder,
    "UserProfile": UserProfile,
    "VectorStoreGuide": VectorStoreGuide,
    "WorldHub": WorldHub,
    "WorldHubSettings": WorldHubSettings,
}

export const pagesConfig = {
    mainPage: "WorldHub",
    Pages: PAGES,
    Layout: __Layout,
};