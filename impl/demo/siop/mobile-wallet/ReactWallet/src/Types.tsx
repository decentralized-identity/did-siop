import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

interface ProfileName {
  name: string;
}

type RootStackParamList = {
  Home: undefined;
  Profile: ProfileName;
  ScanQR: undefined;
};

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Profile'
>;

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Profile'
>;

type ScanQRScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ScanQR'
>;

type HomeProps = {
  navigation: HomeScreenNavigationProp;
};

type ProfileProps = {
  route: ProfileScreenRouteProp;
  navigation: ProfileScreenNavigationProp;
};

type ScanQRProps = {
  navigation: ScanQRScreenNavigationProp;
};

export type {  
  HomeProps,
  ScanQRProps,
  ProfileName,
  ProfileProps,
  RootStackParamList };