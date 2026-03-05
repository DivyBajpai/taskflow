import { useState, useEffect } from 'react';

/**
 * Custom hook to detect screen size and return responsive values
 * Updates on window resize
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        width,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

/**
 * Get responsive chart configurations based on screen size
 */
export const useChartConfig = () => {
  const { isMobile, isTablet, width } = useResponsive();

  return {
    // Screen size flags
    isMobile,
    isTablet,
    width,
    
    // Font sizes
    axisFontSize: isMobile ? 10 : isTablet ? 11 : 12,
    labelFontSize: isMobile ? 11 : isTablet ? 12 : 13,
    legendFontSize: isMobile ? 11 : 11,
    
    // Chart heights - increased for better mobile visibility
    chartHeight: isMobile ? 350 : isTablet ? 340 : 300,
    
    // Margins
    margin: {
      top: 5,
      right: isMobile ? 10 : 10,
      left: isMobile ? -5 : 0,
      bottom: isMobile ? 5 : 10,
    },
    
    // Axis label rotation
    xAxisAngle: isMobile ? -30 : -45,
    xAxisHeight: isMobile ? 60 : 80,
    
    // Pie chart - larger radius for better visibility
    pieOuterRadius: isMobile ? "75%" : "70%",
  };
};

export default useResponsive;
