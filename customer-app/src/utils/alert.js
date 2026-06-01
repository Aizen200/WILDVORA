import { Alert as RNAlert, Platform } from 'react-native';

const Alert = {
  alert: (title, message, buttons) => {
    if (Platform.OS === 'web') {
      const msg = [title, message].filter(Boolean).join('\n');
      if (buttons && buttons.length > 0) {
        // Find cancel and confirm buttons
        const cancelBtn = buttons.find(b => b.style === 'cancel');
        const confirmBtn = buttons.find(b => b.style !== 'cancel') || buttons[0];

        const result = window.confirm(msg);
        if (result) {
          if (confirmBtn && typeof confirmBtn.onPress === 'function') {
            confirmBtn.onPress();
          }
        } else {
          if (cancelBtn && typeof cancelBtn.onPress === 'function') {
            cancelBtn.onPress();
          }
        }
      } else {
        window.alert(msg);
      }
    } else {
      RNAlert.alert(title, message, buttons);
    }
  }
};

export default Alert;
