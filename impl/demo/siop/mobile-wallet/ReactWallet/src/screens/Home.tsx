import { Container, Header, Content, Footer, FooterTab, Button, Icon, Text, View } from 'native-base';
import React from "react";
import { HomeProps } from "Types";

function Home({navigation}: HomeProps) {
  return (
    <Container>
      <Header />
      <Content>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Button transparent onPress={() => navigation.navigate('Profile', {name: 'Jane'})} >
            <Icon name ='people' />
            <Text>Go to Jane's profile</Text>  
          </Button>
        </View>
      </Content>
      <Footer>
        <FooterTab>
          <Button vertical onPress={() => navigation.navigate('Home')} >
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

export { Home };