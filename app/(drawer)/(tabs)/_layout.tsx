import { Tabs } from "expo-router";
import {  FontAwesome,MaterialIcons} from "@expo/vector-icons";
import { Image } from "react-native";
import {Images} from "@/constants/Images"; // Adjust the import path as necessary
import Colors from "@/constants/Colors";
export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
                  tabBarActiveTintColor: Colors.white,
                tabBarInactiveTintColor: Colors.lightGray,
              tabBarHideOnKeyboard: true,}}
                
                
           >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={focused ? Images.homeEnabledIcon : Images.homeDisabledIcon}
              style={{ width: size, height: size, resizeMode: "contain" }}
            />
          ),

          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={focused ? Images.searchEnabledIcon : Images.searchDisabledIcon}
              style={{ width: size, height: size, resizeMode: "contain" }}
            />
            
          ),
          
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Your Library",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={focused ? Images.libraryEnabledIcon : Images.libraryDisabledIcon}
              style={{ width: size, height: size, resizeMode: "contain" }}
            />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}