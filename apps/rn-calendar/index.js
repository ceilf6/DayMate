/**
 * @format
 */
// Polyfill for Intl.PluralRules (required by i18next)
import 'intl-pluralrules';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
