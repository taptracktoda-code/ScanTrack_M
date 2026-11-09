import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableWidth = width - insets.left - insets.right;

  return {
    isCompact: availableWidth / Math.max(fontScale, 1) < 380,
    isShort: height < 700,
    horizontalPadding: availableWidth < 360 ? 12 : availableWidth >= 768 ? 28 : 18,
    insets,
  };
}
