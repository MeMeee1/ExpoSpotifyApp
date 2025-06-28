// app/(drawer)/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import CustomDrawer from '@/components/CustomDrawer';
import { Tabs } from 'expo-router/tabs';

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={CustomDrawer}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerStyle: { width: '75%' },
          overlayColor: 'transparent',
        }}
      >
        {/* This hides the tabs from appearing in the drawer */}
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: () => null, // Hide from drawer
            drawerItemStyle: { display: 'none' }, // Hide from drawer
          }}
        />
        
        
      </Drawer>
    </GestureHandlerRootView>
  );
}