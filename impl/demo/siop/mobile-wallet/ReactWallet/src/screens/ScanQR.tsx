import React from "react";
import { Container, Header, Content, Footer, FooterTab, Button, Icon, Text, View } from 'native-base';
import { ScanQRProps } from "Types";

function ScanQR({ navigation }: ScanQRProps) {
  return (
    <Container>
      <Header />
      <Content>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Scan a QR</Text>
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

export { ScanQR };