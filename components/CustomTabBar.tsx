import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Map, Clock, Bell, User, List } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Check if we should hide the tab bar (e.g. for nested stacks that want it hidden)
  // We check the focused route's options
  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const shouldHide = focusedDescriptor.options.tabBarStyle && (focusedDescriptor.options.tabBarStyle as any).display === 'none';

  if (shouldHide) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          // Skip if href is null (hidden tabs)
          // Note: TypeScript might complain about href not existing on BottomTabNavigationOptions,
          // but it is injected by Expo Router. We cast to any to avoid the error.
          if ((options as any).href === null) return null;

          // Extra protection: Hide specific routes that shouldn't be in the tab bar
          const hiddenRoutes = ['personal-data', 'security', 'settings'];
          if (hiddenRoutes.includes(route.name)) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Central Map Button
          if (route.name === 'map') {
            return (
              <View key={route.key} style={styles.centerButtonPlaceholder}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.centerButton}
                >
                  <Map size={32} color={Colors.white} />
                </TouchableOpacity>
              </View>
            );
          }

          // Standard Tab Item
          let IconComponent = List;
          if (route.name === 'index') IconComponent = List;
          else if (route.name === 'history') IconComponent = Clock;
          else if (route.name === 'alerts') IconComponent = Bell;
          else if (route.name === 'profile') IconComponent = User;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              <View style={[
                styles.iconContainer, 
                isFocused && styles.activeIconContainer
              ]}>
                <IconComponent 
                  size={24} 
                  color={isFocused ? Colors.primary : Colors.textSecondary} 
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none', 
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    width: width - 40,
    height: 70,
    borderRadius: 35,
    paddingHorizontal: 10,
    
    // Shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
  },
  activeIconContainer: {
    // Optional: Highlight background for active state if desired
  },
  centerButtonPlaceholder: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    // This placeholder keeps the space in the flex row
  },
  centerButton: {
    position: 'absolute',
    top: -25, // Pop out above the bar
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    
    // Shadow for button
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: Colors.background, // Creates the "cutout" effect visual
  },
});
