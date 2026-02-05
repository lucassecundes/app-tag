import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Send, ArrowLeft, Bot, User, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { ChatService, ChatMessage } from '../../services/chatService';
import { AIService } from '../../services/aiService';

// Typing Indicator Component
const TypingIndicator = () => {
  const [opacity] = useState(new Animated.Value(0.4));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.messageContainer}>
      <View style={styles.avatarContainer}>
        <Bot size={20} color={Colors.white} />
      </View>
      <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
        <Animated.Text style={[styles.typingText, { opacity }]}>
          Digitando...
        </Animated.Text>
      </View>
    </View>
  );
};

// Welcome View Component
const WelcomeView = () => (
  <View style={styles.welcomeContainer}>
    <View style={styles.welcomeIconContainer}>
      <Bot size={48} color={Colors.white} />
    </View>
    <Text style={styles.welcomeTitle}>Bem-vindo a TAGPRO+ IA</Text>
    <Text style={styles.welcomeSubtitle}>
      Sou seu assistente inteligente. Como posso ajudar você a monitorar seus dispositivos hoje?
    </Text>
  </View>
);

export default function ChatScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [prompts, setPrompts] = useState<any[]>([
    { id: '1', title: 'Onde está meu carro?', prompt: 'Qual é a localização atual do meu carro?' },
    { id: '2', title: 'Listar dispositivos', prompt: 'Quais dispositivos eu tenho cadastrados?' },
    { id: '3', title: 'Últimos alertas', prompt: 'Houve algum alerta recente nos meus dispositivos?' },
    { id: '4', title: 'Histórico de hoje', prompt: 'Por onde meu dispositivo andou hoje?' },
  ]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!isPremium) {
      Alert.alert(
        'Funcionalidade Premium',
        'O chat com IA é exclusivo para assinantes Premium.',
        [
          { text: 'Voltar', onPress: () => router.back() },
          { text: 'Assinar', onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }

    // Always start with a fresh session (empty messages)
    setInitialLoading(false);
  }, [user, isPremium]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || !user || loading) return;

    const userMessageContent = text.trim();
    setInputText('');
    setLoading(true);

    // Otimistic Update
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Save user message
      await ChatService.saveMessage(user.id, 'user', userMessageContent);

      // Call AI
      // Convert internal messages to OpenAI format
      const historyForAI = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      
      historyForAI.push({ role: 'user', content: userMessageContent });

      const aiResponse = await AIService.sendMessage(historyForAI, user.id);
      const aiContent = aiResponse.content || 'Desculpe, não consegui processar sua resposta.';

      const newAiMessage: ChatMessage = {
        role: 'assistant',
        content: aiContent,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, newAiMessage]);
      await ChatService.saveMessage(user.id, 'assistant', aiContent);

    } catch (error) {
      console.error('Erro no chat:', error);
      Alert.alert('Erro', 'Falha ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[
        styles.messageContainer, 
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Bot size={20} color={Colors.white} />
          </View>
        )}
        <View style={[
          styles.bubble, 
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText, 
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatarContainer}>
            <User size={20} color={Colors.primary} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Bot size={24} color={Colors.primary} />
          <Text style={styles.title}>Assistente IA</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {initialLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={{ flex: 1 }}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={messages.length === 0 ? <WelcomeView /> : null}
            ListFooterComponent={loading ? <TypingIndicator /> : null}
          />

          {prompts.length > 0 && messages.length === 0 && (
            <View style={styles.promptsContainer}>
              <Text style={styles.promptsTitle}>Sugestões para começar:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
                {prompts.map((prompt) => (
                  <TouchableOpacity 
                    key={prompt.id} 
                    style={styles.promptChip}
                    onPress={() => handleSend(prompt.prompt)}
                  >
                    <Sparkles size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.promptText}>{prompt.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom, 16) }
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem..."
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Send size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  userAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 4,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.white,
  },
  aiMessageText: {
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.7,
  },
  promptsContainer: {
    padding: 16,
    backgroundColor: Colors.surfaceHighlight,
    marginBottom: 8,
  },
  promptsTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  promptsScroll: {
    flexDirection: 'row',
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  promptText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.primary,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  typingBubble: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
});
