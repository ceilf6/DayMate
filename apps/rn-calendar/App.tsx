import React, { useMemo, useState, useEffect } from 'react';
import {
    Platform,
    StatusBar,
    useColorScheme,
    View,
    StyleSheet,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 导入 Provider
import { I18nProvider, useI18n } from './src/contexts/I18nContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { BackgroundProvider } from './src/contexts/BackgroundContext';

// 导入屏幕组件
import HomeScreen from './src/screens/HomeScreen';
import SplashScreen from './src/components/SplashScreen';

const Stack = createNativeStackNavigator();

function AppContent(): JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { isReady } = useI18n();
    const { colors } = useTheme();
    const [showSplash, setShowSplash] = useState(true);
    const [animationDone, setAnimationDone] = useState(false);

    // Memoize screen options to prevent re-creation on every render
    const screenOptions = useMemo(() => ({
        headerStyle: {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#ffffff' : '#000000',
        headerTitleAlign: 'center' as const,
    }), [isDarkMode]);

    // 当动画完成且 i18n 准备好后，关闭启动画面
    useEffect(() => {
        if (animationDone && isReady) {
            setShowSplash(false);
        }
    }, [animationDone, isReady]);

    // 显示启动画面
    if (showSplash) {
        return (
            <SplashScreen
                onAnimationComplete={() => {
                    setAnimationDone(true);
                }}
            />
        );
    }

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

function App(): JSX.Element {
    return (
        <ThemeProvider>
            <BackgroundProvider>
                <I18nProvider>
                    <AppContent />
                </I18nProvider>
            </BackgroundProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default App;
