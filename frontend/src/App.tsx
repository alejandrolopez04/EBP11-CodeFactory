import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ProductsScreen from "./components/ProductsScreen";
import PricingRulesScreen from "./components/PricingRulesScreen";
import BusinessVariablesScreen from "./components/BusinessVariablesScreen";
import ProductDetailScreen from "./components/ProductDetailScreen";
import PriceHistoryScreen from "./components/PriceHistoryScreen";
import DashboardScreen from "./components/DashboardScreen";

export type Screen = "dashboard" | "products" | "rules" | "variables" | "history" | "product-detail";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("products");

  return (
    <div className="flex h-full bg-[#f4f5f7]">
      <Sidebar active={activeScreen} onNavigate={setActiveScreen} />
      <main className="flex-1 overflow-auto">
        {activeScreen === "dashboard" && <DashboardScreen />}
        {activeScreen === "products" && <ProductsScreen onViewDetail={() => setActiveScreen("product-detail")} />}
        {activeScreen === "rules" && <PricingRulesScreen />}
        {activeScreen === "variables" && <BusinessVariablesScreen />}
        {activeScreen === "history" && <PriceHistoryScreen />}
        {activeScreen === "product-detail" && <ProductDetailScreen onBack={() => setActiveScreen("products")} />}
      </main>
    </div>
  );
}
