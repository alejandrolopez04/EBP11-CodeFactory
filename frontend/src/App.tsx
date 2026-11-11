import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ProductsScreen from "./components/ProductsScreen";
import PricingRulesScreen from "./components/PricingRulesScreen";
import ProductDetailScreen from "./components/ProductDetailScreen";
import ProductPriceHistoryScreen from "./components/ProductPriceHistoryScreen";
import DashboardScreen from "./components/DashboardScreen";
import BusinessVariablesScreen from "./components/BusinessVariablesScreen";
import { BusinessVariablesProvider } from "./business-variables/BusinessVariablesContext";
import AppGate from "./business-variables/AppGate";
import { ProfileProvider } from "./auth/ProfileContext";

export type Screen = "dashboard" | "products" | "rules" | "variables" | "product-detail" | "price-history";

export default function App() {
    const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    // HU14: producto cuyo historial se muestra y pantalla a la que vuelve "Volver"
    const [historyProductId, setHistoryProductId] = useState<number | null>(null);
    const [historyReturnTo, setHistoryReturnTo] = useState<Screen>("products");

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const openHistory = (productId: number) => {
        setHistoryProductId(productId);
        setHistoryReturnTo(activeScreen);
        setActiveScreen("price-history");
    };

    return (
        <ProfileProvider>
            <BusinessVariablesProvider>
            <AppGate>
                <div className="flex h-full bg-[#f4f5f7]">
                    <Sidebar
                        // El historial no tiene pestaña propia: se marca la pantalla desde la que se abrió
                        active={activeScreen === "price-history" ? historyReturnTo : activeScreen}
                        onNavigate={setActiveScreen}
                        isCollapsed={isSidebarCollapsed}
                        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />

                    <main className="flex-1 overflow-auto">
                        {activeScreen === "dashboard" && <DashboardScreen onViewHistory={openHistory} />}
                        {activeScreen === "products" && <ProductsScreen onViewDetail={(id) => { setSelectedProductId(id); setActiveScreen("product-detail"); }} onViewHistory={openHistory} />}
                        {activeScreen === "rules" && <PricingRulesScreen />}
                        {activeScreen === "variables" && <BusinessVariablesScreen />}
                        {activeScreen === "product-detail" && <ProductDetailScreen productId={selectedProductId} onBack={() => setActiveScreen("products")} onViewHistory={openHistory} />}
                        {activeScreen === "price-history" && historyProductId !== null && (
                            <ProductPriceHistoryScreen
                                key={historyProductId}
                                productId={historyProductId}
                                onBack={() => setActiveScreen(historyReturnTo)}
                            />
                        )}
                    </main>
                </div>
            </AppGate>
        </BusinessVariablesProvider>
        </ProfileProvider>
    );
}
