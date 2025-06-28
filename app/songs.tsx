import { logout } from '@/components/AuthLogic';
import Colors from '@/constants/Colors';
import React from 'react';
import { View, Text, Button } from 'react-native';
export default function MainScreen() {
  return (
    <View style={{backgroundColor:Colors.white,flex:1}}> 
      <Text>Welcome to the main app!</Text>
      <Button title='Logout' onPress={logout}></Button>
      {/* Add your main app components here */}
    </View>
  );
}
