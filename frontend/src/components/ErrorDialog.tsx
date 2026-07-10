import React from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Button, Paragraph, Portal } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { ErrorInfo } from '../utils/errorHandler';

interface ErrorDialogProps {
  visible: boolean;
  errorInfo: ErrorInfo | null;
  onDismiss: () => void;
  onRetry?: () => void;
  onAction?: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  visible,
  errorInfo,
  onDismiss,
  onRetry,
  onAction,
}) => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const styles = createStyles(isDark);

  if (!errorInfo) return null;

  const handleAction = () => {
    if (errorInfo.action === 'Retry' && onRetry) {
      onRetry();
    } else if (errorInfo.action && onAction) {
      onAction();
    }
    onDismiss();
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        <Dialog.Title style={styles.title}>{errorInfo.title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph style={styles.message}>{errorInfo.message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={isDark ? '#B0B0B0' : '#666'}>
            {errorInfo.retryable ? 'Cancel' : 'OK'}
          </Button>
          {errorInfo.retryable && errorInfo.action && (
            <Button onPress={handleAction} mode="contained">
              {errorInfo.action}
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  dialog: {
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  title: {
    color: isDark ? '#FFFFFF' : '#000000',
  },
  message: {
    color: isDark ? '#B0B0B0' : '#666',
  },
});

export default ErrorDialog;

