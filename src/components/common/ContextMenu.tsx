import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ContextMenuItem {
  /** Unique key for the menu item */
  key: string;
  /** Label to display */
  label: string;
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Callback when item is pressed */
  onPress: () => void;
  /** Whether this is a destructive action (renders in red) */
  destructive?: boolean;
}

export interface ContextMenuProps {
  /** Whether the context menu is visible */
  visible: boolean;
  /** Callback to close the menu */
  onClose: () => void;
  /** Array of menu items to display */
  items: ContextMenuItem[];
  /** Position of the anchor button (where menu should appear) */
  anchorPosition?: { x: number; y: number; width: number; height: number };
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_PADDING = 8; // Padding from screen edges
const ANIMATION_DURATION = 250;

/**
 * ContextMenu - A reusable contextual popup menu component
 * 
 * Displays a compact, elegant popup menu anchored to a button.
 * Features:
 * - Automatic positioning (above/below anchor based on screen position)
 * - Smooth fade-in + slide-up animation
 * - Dark overlay backdrop
 * - Dismisses on outside tap or item selection
 * - Follows Peak app design system
 * 
 * @example
 * ```tsx
 * const [menuVisible, setMenuVisible] = useState(false);
 * const [buttonLayout, setButtonLayout] = useState(null);
 * 
 * const menuItems: ContextMenuItem[] = [
 *   {
 *     key: 'edit',
 *     label: 'Edit workout',
 *     icon: 'pencil-outline',
 *     onPress: () => handleEdit(),
 *   },
 *   {
 *     key: 'delete',
 *     label: 'Delete workout',
 *     icon: 'trash-outline',
 *     onPress: () => handleDelete(),
 *     destructive: true,
 *   },
 * ];
 * 
 * <TouchableOpacity 
 *   onPress={(e) => {
 *     e.currentTarget.measure((x, y, width, height, pageX, pageY) => {
 *       setButtonLayout({ x: pageX, y: pageY, width, height });
 *       setMenuVisible(true);
 *     });
 *   }}
 * >
 *   <Ionicons name="ellipsis-vertical" size={24} />
 * </TouchableOpacity>
 * 
 * <ContextMenu
 *   visible={menuVisible}
 *   onClose={() => setMenuVisible(false)}
 *   items={menuItems}
 *   anchorPosition={buttonLayout}
 * />
 * ```
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  onClose,
  items,
  anchorPosition,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const [menuLayout, setMenuLayout] = useState<{ width: number; height: number } | null>(null);
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  // Calculate menu position (above or below anchor)
  const calculatePosition = () => {
    if (!anchorPosition || !menuLayout) {
      return { top: 0, left: 0, showAbove: false };
    }

    const { x, y, height: anchorHeight } = anchorPosition;
    const { height: menuHeight, width: menuWidth } = menuLayout;

    // Determine if there's enough space below the anchor
    const spaceBelow = SCREEN_HEIGHT - (y + anchorHeight);
    const showAbove = spaceBelow < menuHeight + 20 && y > menuHeight + 20;

    let top: number;
    if (showAbove) {
      // Position above the anchor with some spacing
      top = y - menuHeight - 8;
    } else {
      // Position below the anchor with some spacing
      top = y + anchorHeight + 8;
    }

    // Center horizontally relative to anchor, but keep within screen bounds
    let left = x - menuWidth / 2 + anchorPosition.width / 2;
    left = Math.max(MENU_PADDING, Math.min(left, Dimensions.get('window').width - menuWidth - MENU_PADDING));

    return { top, left, showAbove };
  };

  const position = calculatePosition();

  // Animate in/out
  useEffect(() => {
    if (visible) {
      setHasBeenVisible(true);
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(16);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 200,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Marquer comme non visible après l'animation
        if (!visible) {
          setHasBeenVisible(false);
        }
      });
    }
  }, [visible]);

  const handleItemPress = (item: ContextMenuItem) => {
    // Close menu first
    onClose();
    // Wait for animation to finish, then trigger action
    // Délai plus long sur iOS pour garantir que le Modal est complètement démonté sur TestFlight
    const delay = Platform.OS === 'ios' ? 350 : 200;
    setTimeout(() => {
      item.onPress();
    }, delay);
  };

  // Ne pas rendre si jamais visible et pas visible actuellement
  if (!hasBeenVisible && !visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Dark backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
              },
            ]}
          />

          {/* Menu container */}
          <Animated.View
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              if (!menuLayout) {
                setMenuLayout({ width, height });
              }
            }}
            style={[
              styles.menuContainer,
              {
                top: position.top,
                left: position.left,
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim,
                  },
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                onPressIn={() => setPressedItem(item.key)}
                onPressOut={() => setPressedItem(null)}
                onPress={() => handleItemPress(item)}
                style={[
                  styles.menuItem,
                  index === 0 && styles.menuItemFirst,
                  index === items.length - 1 && styles.menuItemLast,
                  pressedItem === item.key && styles.menuItemPressed,
                ]}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.destructive ? '#FF3B30' : '#FFFFFF'}
                    style={styles.menuItemIcon}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      item.destructive && styles.menuItemTextDestructive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    minWidth: 200,
    maxWidth: 280,
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemFirst: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItemLast: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  menuItemTextDestructive: {
    color: '#FF3B30',
  },
});

