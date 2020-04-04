import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Home } from 'screens/Home';
import { Profile } from 'screens/Profile';
import { RootStackParamList } from 'Types';

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
          name="Profile" 
          component={Profile}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}