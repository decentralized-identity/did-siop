import React from "react";
import { View, Text, Button } from "react-native";
import { ProfileProps } from "Types";

function Profile({ route, navigation }: ProfileProps) {
  const { name } = route.params;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Welcome {name}</Text>
      <Button
        title="Go to Details... again"
        onPress={() =>
          navigation.push('Profile', {
            name: 'Jane' + Math.floor(Math.random() * 100),
          })
        }
      />
      <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
      <Button title="Go back" onPress={() => navigation.goBack()} />
    </View>
  );
}

export { Profile };