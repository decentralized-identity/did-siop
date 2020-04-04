import React from 'react';
import { Container, Content, Footer, FooterTab, Button, Icon, Text } from 'native-base';
import { ScanQRProps } from 'Types';
import * as config from 'Config'
import * as util from 'util/Util'
import QRCodeScanner from 'react-native-qrcode-scanner';
import { SiopAckRequest } from 'siop/dtos/Siop';

class ScanQR extends React.Component<ScanQRProps> {
  readonly navigation = (this.props as ScanQRProps).navigation

  sendSiopUriToBackend = async (siopUri: string): Promise<SiopAckRequest> => {
    if (!siopUri) throw Error('URI not defined')

    const response:SiopAckRequest = await util.doPostCall({ siopUri }, config.WALLET_BACKEND_URI)
    console.log(`Response: ${JSON.stringify(response)}`)
    return response;  
  }
  onSuccess = (e: { data: string; }) => {
    console.log(`QR Code data read: ${e.data}`);
    this.sendSiopUriToBackend(e.data)
    .then((response:SiopAckRequest) => {console.log(JSON.stringify(response))})
    .catch((error: Error) => console.log('An error occured', error))
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