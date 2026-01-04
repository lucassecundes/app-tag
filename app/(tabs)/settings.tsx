import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, Bell, Volume2, Moon, Info } from 'lucide-react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

export default function SettingsScreen() {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    const version = Constants.expoConfig?.version || '1.0.0';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Configurações</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Geral</Text>
                
                <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <View style={styles.iconContainer}>
                            <Bell size={20} color={Colors.text} />
                        </View>
                        <Text style={styles.settingLabel}>Notificações Push</Text>
                    </View>
                    <Switch
                        value={pushEnabled}
                        onValueChange={setPushEnabled}
                        trackColor={{ false: Colors.surfaceHighlight, true: Colors.primary }}
                        thumbColor={Colors.white}
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <View style={styles.iconContainer}>
                            <Volume2 size={20} color={Colors.text} />
                        </View>
                        <Text style={styles.settingLabel}>Sons de Alerta</Text>
                    </View>
                    <Switch
                        value={soundEnabled}
                        onValueChange={setSoundEnabled}
                        trackColor={{ false: Colors.surfaceHighlight, true: Colors.primary }}
                        thumbColor={Colors.white}
                    />
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Aparência</Text>
                <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <View style={styles.iconContainer}>
                            <Moon size={20} color={Colors.text} />
                        </View>
                        <Text style={styles.settingLabel}>Modo Escuro</Text>
                    </View>
                    <Switch
                        value={darkMode}
                        onValueChange={setDarkMode}
                        trackColor={{ false: Colors.surfaceHighlight, true: Colors.primary }}
                        thumbColor={Colors.white}
                    />
                </View>

                 <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Sobre</Text>
                <TouchableOpacity style={styles.settingItem} disabled>
                    <View style={styles.settingLeft}>
                         <View style={styles.iconContainer}>
                            <Info size={20} color={Colors.text} />
                        </View>
                        <View>
                            <Text style={styles.settingLabel}>Versão do App</Text>
                            <Text style={styles.settingValue}>{version}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: Colors.text,
  },
  settingValue: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceHighlight,
    marginVertical: 12,
    marginBottom: 28,
  },
});
