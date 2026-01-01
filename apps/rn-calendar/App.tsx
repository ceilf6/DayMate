import React, { useMemo } from 'react';
import {
    Platform,
    StatusBar,
    useColorScheme,
    ActivityIndicator,
    View,
    StyleSheet,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 导入国际化 Provider
import { I18nProvider, useI18n } from './src/contexts/I18nContext';

// 导入屏幕组件
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

function AppContent(): JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { isReady } = useI18n();

    // Memoize screen options to prevent re-creation on every render
    const screenOptions = useMemo(() => ({
        headerStyle: {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#ffffff' : '#000000',
        headerTitleAlign: 'center' as const,
    }), [isDarkMode]);

    // 等待 i18n 初始化
    if (!isReady) {
        return (
            <View style={[styles.loading, isDarkMode && styles.loadingDark]}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
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
        <I18nProvider>
            <AppContent />
        </I18nProvider>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
    },
    loadingDark: {
        backgroundColor: '#0B0B0F',
    },
});

export default App;
