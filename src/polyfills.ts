import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  const noop = () => null;
  (global as any).localStorage = {
    getItem: noop,
    setItem: noop,
    removeItem: noop,
    clear: noop,
  };
}
