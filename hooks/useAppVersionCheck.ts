import { useEffect, useState } from 'react';
import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { compareVersions } from '../utils/version';

interface VersionConfig {
    minVersion: string;
    latestVersion: string;
    storeUrl: string;
    forceUpdate: boolean;
}

interface AppVersionSettings {
    ios: VersionConfig;
    android: VersionConfig;
}

export function useAppVersionCheck() {
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [storeUrl, setStoreUrl] = useState('');
    const [latestVersion, setLatestVersion] = useState('');
    const [forceUpdate, setForceUpdate] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkVersion();
    }, []);

    const checkVersion = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'app_versions')
                .single();

            if (error || !data) return;

            const settings = data.value as AppVersionSettings;
            const platformConfig = Platform.OS === 'ios' ? settings.ios : settings.android;

            if (!platformConfig) return;

            const currentVersion = Constants.expoConfig?.version || '1.0.0';
            setLatestVersion(platformConfig.latestVersion);
            setStoreUrl(platformConfig.storeUrl);
            setForceUpdate(platformConfig.forceUpdate);

            // Check if current version is less than latest version
            if (compareVersions(currentVersion, platformConfig.latestVersion) < 0) {
                setIsUpdateAvailable(true);
            }
        } catch (error) {
            console.error('Error checking app version:', error);
        } finally {
            setLoading(false);
        }
    };

    const openStore = () => {
        if (storeUrl) {
            Linking.openURL(storeUrl);
        }
    };

    return { isUpdateAvailable, storeUrl, latestVersion, forceUpdate, loading, openStore };
}
