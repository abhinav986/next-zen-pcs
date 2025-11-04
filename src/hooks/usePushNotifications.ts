import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv-IXgWruiBzezocng7L7w9hvYW0h18dJVwx-6HaMQE0dC7r6jWqJmP9DfqdJpWRr7cNIHYKQ';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'You need to allow notifications to receive daily UPSC quiz updates.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to enable notifications.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Save subscription to database
      const subscriptionData = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint!,
          p256dh: subscriptionData.keys!.p256dh,
          auth: subscriptionData.keys!.auth,
          is_enabled: true,
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Success!',
        description: 'You will now receive daily UPSC quiz notifications.',
      });
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Delete from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }

      setIsSubscribed(false);
      toast({
        title: 'Unsubscribed',
        description: 'You will no longer receive push notifications.',
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  };
};
