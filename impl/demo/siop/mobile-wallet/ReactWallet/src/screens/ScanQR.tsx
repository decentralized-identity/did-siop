import React from 'react';
import { Container, Header, Content, Footer, FooterTab, Button, Icon, Text, View } from 'native-base';
import { ScanQRProps } from "Types";
import {
  Linking
} from 'react-native';
 
import QRCodeScanner from 'react-native-qrcode-scanner';

class ScanQR extends React.Component<ScanQRProps> {
  readonly navigation = (this.props as ScanQRProps).navigation

  onSuccess = (e: { data: string; }) => {
    console.log(e.data);
    Linking.openURL(e.data).catch(err =>
      console.error('An error occured', err)
    );
  };

  render() {
    return (
      <Container>
        <Content>
          <QRCodeScanner
            onRead={this.onSuccess}
          />
        </Content>
        <Footer>
          <FooterTab>
            <Button vertical onPress={() => this.navigation.navigate('Home')} >
              <Icon name="home" />
              <Text>Home</Text>
            </Button>
            <Button vertical onPress={() => this.navigation.navigate('ScanQR')} >
              <Icon name="camera" />
              <Text>Scan QR</Text>
            </Button>
            <Button vertical onPress={() =>
                this.navigation.push('Profile', {
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
}

export { ScanQR };