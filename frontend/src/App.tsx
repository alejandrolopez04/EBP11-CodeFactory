import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ProductsScreen from "./components/ProductsScreen";
import PricingRulesScreen from "./components/PricingRulesScreen";
import ProductDetailScreen from "./components/ProductDetailScreen";
import PriceHistoryScreen from "./components/PriceHistoryScreen";
import PriceSimulationScreen from "./components/PriceSimulationScreen";
import DashboardScreen from "./components/DashboardScreen";
import BusinessVariablesScreen from "./components/BusinessVariablesScreen";
import { BusinessVariablesProvider } from "./business-variables/BusinessVariablesContext";
import AppGate from "./business-variables/AppGate";
import { ProfileProvider } from "./auth/ProfileContext";

export type Screen = "dashboard" | "products" | "rules" | "variables" | "simulation" | "history" | "product-detail";

export default function App() {
    const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    // HU13: regla con la que se abre el simulador desde la pantalla de reglas (null = vacío)
    const [simulationRuleId, setSimulationRuleId] = useState<number | null>(null);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const navigate = (screen: Screen) => {
        if (screen === "simulation") setSimulationRuleId(null);
        setActiveScreen(screen);
    };

    return (
        <ProfileProvider>
            <BusinessVariablesProvider>
            <AppGate>
                <div className="flex h-full bg-[#f4f5f7]">
                    <Sidebar
                        active={activeScreen}
                        onNavigate={navigate}
                        isCollapsed={isSidebarCollapsed}
                        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />

                    <main className="flex-1 overflow-auto">
                        {activeScreen === "dashboard" && <DashboardScreen />}
                        {activeScreen === "products" && <ProductsScreen onViewDetail={(id) => { setSelectedProductId(id); setActiveScreen("product-detail"); }} />}
                        {activeScreen === "rules" && <PricingRulesScreen onSimulate={(ruleId) => { setSimulationRuleId(ruleId); setActiveScreen("simulation"); }} />}
                        {activeScreen === "variables" && <BusinessVariablesScreen />}
                        {activeScreen === "simulation" && <PriceSimulationScreen key={simulationRuleId ?? "new"} initialRuleId={simulationRuleId} />}
                        {activeScreen === "history" && <PriceHistoryScreen />}
                        {activeScreen === "product-detail" && <ProductDetailScreen productId={selectedProductId} onBack={() => setActiveScreen("products")} />}
                    </main>
                </div>
            </AppGate>
        </BusinessVariablesProvider>
        </ProfileProvider>
    );
}
