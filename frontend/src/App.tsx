import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar        from "./components/layout/Navbar";
import Footer        from "./components/layout/Footer";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { ToastProvider } from "./components/shared/Toast";
import Home          from "./pages/Home";
import Catalog       from "./pages/Catalog";
import FeedDetail    from "./pages/FeedDetail";
import Provider      from "./pages/Provider";
import HowItWorks    from "./pages/HowItWorks";

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/"             element={<Home />} />
                <Route path="/catalog"      element={<Catalog />} />
                <Route path="/feed/:id"     element={<FeedDetail />} />
                <Route path="/provider"     element={<Provider />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                    <p className="font-mono text-text-3 text-6xl mb-4">404</p>
                    <p className="font-display text-xl text-text-1 mb-6">Page not found</p>
                    <a href="/" className="text-cyan font-mono text-sm hover:underline">← Back home</a>
                  </div>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}