import '@testing-library/jest-dom';

// jsdom doesn't implement these; framer-motion's whileInView and Recharts'
// ResponsiveContainer both need them to exist on window.
class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = global.IntersectionObserver || MockObserver;
global.ResizeObserver = global.ResizeObserver || MockObserver;
