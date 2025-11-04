import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationToggle = () => {
  const { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications. Please try using Chrome, Firefox, or Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Daily Quiz Notifications
        </CardTitle>
        <CardDescription>
          Get notified about daily UPSC quiz updates and important preparation tips
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Status: {isSubscribed ? '✓ Enabled' : '✗ Disabled'}
            </p>
            {permission === 'denied' && (
              <p className="text-sm text-destructive">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </div>
          <Button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading || permission === 'denied'}
            variant={isSubscribed ? 'outline' : 'default'}
          >
            {isLoading ? 'Loading...' : isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p>📱 Receive notifications for:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Daily UPSC quiz challenges</li>
            <li>Current affairs updates</li>
            <li>Study tips and reminders</li>
            <li>Important exam notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
