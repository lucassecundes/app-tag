import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, LayoutAnimation, UIManager, Platform, Image } from 'react-native';
import { ChevronDown, ChevronUp, Search, MessageCircle, ArrowLeft, HelpCircle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { faqData, FAQItem } from './faqData';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

// Habilita animações de layout no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQAccordionItem = ({ item, isExpanded, onPress }: { item: FAQItem, isExpanded: boolean, onPress: () => void }) => {
  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity style={styles.accordionHeader} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.questionText}>{item.question}</Text>
        {isExpanded ? (
          <ChevronUp size={20} color={Colors.primary} />
        ) : (
          <ChevronDown size={20} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.accordionContent}>
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
};

export default function FAQScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const handleToggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return faqData;
    
    const query = searchQuery.toLowerCase();
    return faqData.filter(
      (item) => 
        item.question.toLowerCase().includes(query) || 
        item.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const openWhatsApp = () => {
    const phoneNumber = "556740420408"; // Número de suporte recuperado do antigo botão
    const message = "Olá, preciso de suporte com o app Tag+.";
    Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`)
      .catch(() => {
        Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
      });
  };

  const ListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <View style={styles.headerIconContainer}>
        <HelpCircle size={36} color={Colors.white} />
      </View>
      <Text style={styles.headerTitle}>Central de Ajuda</Text>
      <Text style={styles.headerDescription}>
        Encontre respostas rápidas para as dúvidas mais comuns sobre a TAG+ e o aplicativo.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: false // Esconde o header padrão do Expo Router para criar um customizado
        }}
      />

      {/* Custom Header with Back Button and Safe Area padding */}
      <SafeAreaView edges={['top']} style={styles.customHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerScreenTitle}>Ajuda</Text>
          <View style={{ width: 40 }} /* Spacer to center the title */ />
        </View>
      </SafeAreaView>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar dúvida..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={!searchQuery ? ListHeader : null}
        renderItem={({ item }) => (
          <FAQAccordionItem
            item={item}
            isExpanded={expandedId === item.id}
            onPress={() => handleToggle(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma dúvida encontrada para "{searchQuery}".</Text>
          </View>
        )}
      />

      {/* Floating Action Button - WhatsApp */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8} 
        onPress={openWhatsApp}
      >
        <MessageCircle size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  customHeader: {
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerScreenTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: Colors.white,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.white,
    height: '100%',
  },
  listHeaderContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: Colors.white,
    marginBottom: 8,
  },
  headerDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Espaço para o FAB
  },
  accordionContainer: {
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: Colors.white,
    flex: 1,
    paddingRight: 16,
    lineHeight: 20,
  },
  accordionContent: {
    padding: 16,
    paddingTop: 0,
  },
  answerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366', // Cor oficial do WhatsApp
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});