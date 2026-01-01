import React, { useMemo } from 'react';
import {
    Platform,
    StatusBar,
    useColorScheme,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 导入屏幕组件
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

function App(): JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    // Memoize screen options to prevent re-creation on every render
    const screenOptions = useMemo(() => ({
        headerStyle: {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#ffffff' : '#000000',
        headerTitleAlign: 'center' as const,
    }), [isDarkMode]);

    return (
        <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={screenOptions}>
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
