import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Colors } from '../../constants/Colors';
import { AlertTriangle, Battery, Shield, WifiOff } from 'lucide-react-native';

const MOCK_ALERTS = [
  { id: '1', type: 'geofence', title: 'Saiu da Área Segura', message: 'Veículo saiu da Zona Sul', time: '10 min atrás' },
  { id: '2', type: 'movement', title: 'Movimento Detectado', message: 'Veículo em movimento fora do horário', time: '1h atrás' },
  { id: '3', type: 'disconnect', title: 'Dispositivo Desconectado', message: 'Perda de sinal GPS', time: '2h atrás' },
  { id: '4', type: 'battery', title: 'Bateria Fraca', message: 'Nível de bateria abaixo de 15%', time: 'Ontem' },
];

export default function AlertsScreen() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'geofence': return <Shield size={24} color={Colors.primary} />;
      case 'movement': return <AlertTriangle size={24} color={Colors.warning} />;
      case 'disconnect': return <WifiOff size={24} color={Colors.textSecondary} />;
      case 'battery': return <Battery size={24} color={Colors.error} />;
      default: return <AlertTriangle size={24} color={Colors.text} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
      </View>

      <FlatList
        data={MOCK_ALERTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.alertItem}>
            <View style={styles.iconContainer}>
              {getIcon(item.type)}
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertMessage}>{item.message}</Text>
              <Text style={styles.alertTime}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: Colors.text,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  alertMessage: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  alertTime: {
    color: Colors.textMuted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
});
