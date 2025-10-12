import { useEffect, useState } from 'react';
import AppLayout from './AppLayout';
import MobileAppLayout from './MobileAppLayout';

const ResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render mobile layout for small screens, desktop layout for larger screens
  return isMobile ? <MobileAppLayout /> : <AppLayout />;
};

export default ResponsiveLayout;
