import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

interface ProfileName {
  name: string;
}

type RootStackParamList = {
  Home: undefined;
  Profile: ProfileName;
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

type HomeProps = {
  navigation: HomeScreenNavigationProp;
};

type ProfileProps = {
  route: ProfileScreenRouteProp;
  navigation: ProfileScreenNavigationProp;
};

export type { ProfileName, HomeProps, ProfileProps, RootStackParamList };