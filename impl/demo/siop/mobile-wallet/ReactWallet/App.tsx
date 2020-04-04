import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Home } from 'screens/Home';
import { Profile } from 'screens/Profile';
import { RootStackParamList } from 'Types';
import { ScanQR } from 'screens/ScanQR';

const RootStack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator>
        <RootStack.Screen
          name="Home"
          component={Home}
          options={{title: 'Welcome'}}
        />
        <RootStack.Screen 
          name="ScanQR" 
          component={ScanQR}
          options={{title: 'Scan a QR'}}
        />
        <RootStack.Screen 
          name="Profile" 
          component={Profile}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}