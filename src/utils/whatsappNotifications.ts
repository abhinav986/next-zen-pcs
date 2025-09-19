import { supabase } from "@/integrations/supabase/client";
import { WeakSectionAnalysis } from "./weakSectionAnalyzer";

interface WhatsAppNotificationData {
  phone_number: string;
  message: string;
  type: 'weak_section' | 'current_affairs' | 'test_notification' | 'test';
}

export const sendWhatsAppNotification = async (data: WhatsAppNotificationData) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-whatsapp', {
      body: data
    });

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    throw error;
  }
};

export const sendWeakSectionUpdate = async (userId: string, weakSections: WeakSectionAnalysis[]) => {
  try {
    // Get user's WhatsApp preferences
    const { data: preferences, error: prefError } = await supabase
      .from('whatsapp_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .eq('weak_section_updates', true)
      .single();

    if (prefError || !preferences) {
      console.log('User has no WhatsApp preferences or disabled weak section updates');
      return;
    }

    if (weakSections.length === 0) {
      // Send congratulatory message
      const message = `🎉 Great news! You don't have any weak sections right now. Keep up the excellent work with your UPSC preparation! 

📈 Continue practicing to maintain your strong performance across all topics.

🎯 UPSC Prep Academy`;

      await sendWhatsAppNotification({
        phone_number: preferences.phone_number,
        message,
        type: 'weak_section'
      });
      return;
    }

    // Create weak section message
    const topWeakSections = weakSections.slice(0, 3);
    let message = `📊 Your Weak Section Analysis - UPSC Prep Academy

🔍 Areas needing attention:
`;

    topWeakSections.forEach((section, index) => {
      message += `
${index + 1}. ${section.topic}
   📉 Accuracy: ${section.accuracy.toFixed(1)}%
   💡 ${section.recommendation}
`;
    });

    message += `
🎯 Focus on these topics in your next study session!

📚 Access study materials: https://your-app-url.com/study-materials
🧪 Practice tests: https://your-app-url.com/test-series

Keep pushing forward! 💪`;

    await sendWhatsAppNotification({
      phone_number: preferences.phone_number,
      message,
      type: 'weak_section'
    });

  } catch (error) {
    console.error('Error sending weak section WhatsApp update:', error);
  }
};

export const sendCurrentAffairsUpdate = async (userId: string, updates: string[]) => {
  try {
    // Get user's WhatsApp preferences
    const { data: preferences, error: prefError } = await supabase
      .from('whatsapp_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .eq('current_affairs_updates', true)
      .single();

    if (prefError || !preferences) {
      console.log('User has no WhatsApp preferences or disabled current affairs updates');
      return;
    }

    const todayDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let message = `📰 Current Affairs Update - ${todayDate}

🔥 Today's Important News for UPSC:
`;

    updates.slice(0, 5).forEach((update, index) => {
      message += `
${index + 1}. ${update}
`;
    });

    message += `
📖 Read detailed analysis on our platform
🎯 UPSC Prep Academy

Stay informed, stay ahead! 🚀`;

    await sendWhatsAppNotification({
      phone_number: preferences.phone_number,
      message,
      type: 'current_affairs'
    });

  } catch (error) {
    console.error('Error sending current affairs WhatsApp update:', error);
  }
};

export const sendTestNotification = async (userId: string, testName: string, score: number, totalQuestions: number) => {
  try {
    // Get user's WhatsApp preferences
    const { data: preferences, error: prefError } = await supabase
      .from('whatsapp_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .eq('test_notifications', true)
      .single();

    if (prefError || !preferences) {
      console.log('User has no WhatsApp preferences or disabled test notifications');
      return;
    }

    const percentage = Math.round((score / totalQuestions) * 100);
    let emoji = '📈';
    let encouragement = 'Keep practicing!';

    if (percentage >= 80) {
      emoji = '🎉';
      encouragement = 'Outstanding performance!';
    } else if (percentage >= 60) {
      emoji = '👏';
      encouragement = 'Good job! Keep improving!';
    } else if (percentage >= 40) {
      emoji = '📚';
      encouragement = 'Focus on weak areas and try again!';
    } else {
      emoji = '💪';
      encouragement = 'Don\'t give up! Practice makes perfect!';
    }

    const message = `${emoji} Test Completed - UPSC Prep Academy

📝 Test: ${testName}
📊 Score: ${score}/${totalQuestions} (${percentage}%)

${encouragement}

🔍 Check your detailed analysis and weak sections on the dashboard.

🎯 Keep pushing towards your UPSC dream!`;

    await sendWhatsAppNotification({
      phone_number: preferences.phone_number,
      message,
      type: 'test_notification'
    });

  } catch (error) {
    console.error('Error sending test notification via WhatsApp:', error);
  }
};