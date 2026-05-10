import { Animated } from 'react-native';

export const barsHidden = new Animated.Value(0); // 0 = visible, 1 = hidden

export const showBars = () => {
  barsHidden.stopAnimation();
  Animated.spring(barsHidden, {
    toValue: 0,
    useNativeDriver: true,
    overshootClamping: true,
    tension: 120,
    friction: 22,
  }).start();
};

export const hideBars = () => {
  barsHidden.stopAnimation();
  Animated.spring(barsHidden, {
    toValue: 1,
    useNativeDriver: true,
    overshootClamping: true,
    tension: 120,
    friction: 22,
  }).start();
};
