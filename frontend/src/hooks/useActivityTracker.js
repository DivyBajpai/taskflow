import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

/**
 * Hook to track user activity and send heartbeats to backend
 * Tracks mouse movements, clicks, and keyboard events
 */
const useActivityTracker = () => {
  const { user } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const activeTimeRef = useRef(0);
  const heartbeatIntervalRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const isActiveRef = useRef(false);
  const metadataRef = useRef({
    mouseClicks: 0,
    keystrokes: 0,
    pageViews: 0
  });

  useEffect(() => {
    // Only track if user is logged in
    if (!user) return;

    console.log('🔍 Activity tracker initialized');

    // Mark as active initially
    isActiveRef.current = true;
    lastActivityRef.current = Date.now();

    // Track mouse movement
    const handleMouseMove = () => {
      if (!isActiveRef.current) {
        console.log('✅ User became active (mouse movement)');
        isActiveRef.current = true;
        lastActivityRef.current = Date.now();
      }
      resetInactivityTimeout();
    };

    // Track mouse clicks
    const handleClick = () => {
      metadataRef.current.mouseClicks++;
      if (!isActiveRef.current) {
        console.log('✅ User became active (click)');
        isActiveRef.current = true;
        lastActivityRef.current = Date.now();
      }
      resetInactivityTimeout();
    };

    // Track keyboard activity
    const handleKeyPress = () => {
      metadataRef.current.keystrokes++;
      if (!isActiveRef.current) {
        console.log('✅ User became active (keyboard)');
        isActiveRef.current = true;
        lastActivityRef.current = Date.now();
      }
      resetInactivityTimeout();
    };

    // Track page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop counting
        if (isActiveRef.current) {
          console.log('⏸️ User inactive (page hidden)');
          isActiveRef.current = false;
        }
      } else {
        // Page is visible again
        console.log('▶️ User active (page visible)');
        isActiveRef.current = true;
        lastActivityRef.current = Date.now();
        metadataRef.current.pageViews++;
        resetInactivityTimeout();
      }
    };

    // Reset inactivity timeout
    const resetInactivityTimeout = () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Mark as inactive after 2 minutes of no activity
      activityTimeoutRef.current = setTimeout(() => {
        if (isActiveRef.current) {
          console.log('⏸️ User inactive (timeout)');
          isActiveRef.current = false;
        }
      }, 2 * 60 * 1000); // 2 minutes
    };

    // Send heartbeat to backend every 30 seconds
    const sendHeartbeat = async () => {
      const now = Date.now();
      
      // Calculate active time since last heartbeat
      if (isActiveRef.current) {
        const timeSinceLastActivity = Math.floor((now - lastActivityRef.current) / 1000);
        activeTimeRef.current += timeSinceLastActivity;
        lastActivityRef.current = now;
      }

      // Only send if there's active time to report
      if (activeTimeRef.current > 0) {
        try {
          await api.post('/activity/heartbeat', {
            activeSeconds: activeTimeRef.current,
            metadata: { ...metadataRef.current }
          });

          console.log(`💓 Heartbeat sent: ${activeTimeRef.current}s active`);

          // Reset counters after successful send
          activeTimeRef.current = 0;
          metadataRef.current = {
            mouseClicks: 0,
            keystrokes: 0,
            pageViews: 0
          };
        } catch (error) {
          console.error('Failed to send activity heartbeat:', error);
          // Keep the active time to retry next heartbeat
        }
      }
    };

    // Set up event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start heartbeat interval (every 30 seconds)
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30 * 1000);

    // Initial inactivity timeout
    resetInactivityTimeout();

    // Cleanup
    return () => {
      console.log('🛑 Activity tracker cleanup');
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Send final heartbeat before unmount
      if (activeTimeRef.current > 0) {
        api.post('/activity/heartbeat', {
          activeSeconds: activeTimeRef.current,
          metadata: { ...metadataRef.current }
        }).catch(err => console.error('Failed to send final heartbeat:', err));
      }
    };
  }, [user]);

  return null;
};

export default useActivityTracker;
