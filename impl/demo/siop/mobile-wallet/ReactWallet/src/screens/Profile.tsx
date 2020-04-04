import React from "react";
import { Container, Header, Content, Footer, FooterTab, Button, Icon, Text, View } from 'native-base';
import { ProfileProps } from "Types";

function Profile({ route, navigation }: ProfileProps) {
  const { name } = route.params;
  return (
    <Container>
      <Header />
      <Content>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Welcome {name}</Text>
          <Button transparent
            onPress={() =>
              navigation.push('Profile', {
                name: 'Jane' + Math.floor(Math.random() * 100),
              })
            } 
          >
            <Text>Go to Details... again</Text>
          </Button>
          <Button transparent onPress={() => navigation.navigate('Home')} >
            <Text>Go to Home</Text>
          </Button>
          <Button transparent onPress={() => navigation.goBack()} >
            <Text>Go back</Text>
          </Button>
        </View>
      </Content>
      <Footer>
        <FooterTab>
          <Button vertical onPress={() => navigation.navigate('Home')}>
            <Icon name="home" />
            <Text>Home</Text>
          </Button>
          <Button vertical onPress={() => navigation.navigate('ScanQR')} >
            <Icon name="camera" />
            <Text>Scan QR</Text>
          </Button>
          <Button vertical onPress={() =>
              navigation.push('Profile', {
                name: 'Jane' + Math.floor(Math.random() * 100),
              })
            } >
            <Icon name="person" />
            <Text>Profile</Text>
          </Button>
        </FooterTab>
      </Footer>
    </Container>
  );
}

export { Profile };