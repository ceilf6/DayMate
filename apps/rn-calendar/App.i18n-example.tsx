import React, { useMemo, useEffect, useState } from 'react';
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

// 导入国际化服务
import { useI18n } from './src/services/i18nService';

// 导入屏幕组件
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

function App(): JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { isReady } = useI18n(); // 使用 i18n hook

    // Memoize screen options to prevent re-creation on every render
    const screenOptions = useMemo(() => ({
        headerStyle: {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#ffffff' : '#000000',
        headerTitleAlign: 'center' as const,
    }), [isDarkMode]);

    // 等待 i18n 初始化完成
    if (!isReady) {
        return (
            <View style={styles.loadingContainer}>
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

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
    },
});

export default App;
