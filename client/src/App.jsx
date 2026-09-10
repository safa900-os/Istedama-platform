import { Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Decor from './components/Decor';
import FloatingActions from './components/FloatingActions';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';
import { useAccessibility } from './context/AccessibilityContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import About from './pages/About';
import Contact from './pages/Contact';
import News from './pages/News';
import Services from './pages/Services';
import Tenders from './pages/Tenders';
import Facilities from './pages/Facilities';
import Advertise from './pages/Advertise';
import Discounts from './pages/Discounts';
import NotFound from './pages/NotFound';

export default function App() {
  // Optional-chained on purpose: the provider is always above this in
  // `main.jsx`, but a missing one should degrade to the reader's own
  // system preference rather than white-screen the whole site.
  const reduceMotion = useAccessibility()?.reduceMotion ?? false;

  return (
    /*
      Almost every animation on this site is framer-motion, which writes inline
      transforms — so the `a11y-reduce-motion` CSS class, which only kills CSS
      animations and transitions, left all of them running. Someone who turned
      the setting on still got the full sliding, fading page.

      `reducedMotion="user"` is the default state on purpose: it honours the
      reader's operating-system preference without their having to find this
      site's own switch first.
    */
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
    <div className="flex min-h-screen flex-col">
      {/* Every route change starts at the top of the new page. */}
      <ScrollToTop />
      <Decor />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/facilities" element={<Facilities />} />
          <Route path="/discounts" element={<Discounts />} />
          <Route path="/advertise" element={<Advertise />} />
          <Route path="/news" element={<News />} />
          <Route path="/services" element={<Services />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <FloatingActions />
      <ChatbotWidget />
    </div>
    </MotionConfig>
  );
}
