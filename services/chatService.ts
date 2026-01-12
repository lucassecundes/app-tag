import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export const ChatService = {
  async getHistory(userId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    return data || [];
  },

  async saveMessage(userId: string, role: 'user' | 'assistant', content: string) {
    const { error } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        role,
        content,
      });

    if (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  },

  async getSystemPrompt(): Promise<string | null> {
    const { data, error } = await supabase
      .from('chat_prompts')
      .select('prompt_text')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching system prompt:', error);
      return null;
    }

    return data?.prompt_text || null;
  },

  async clearHistory(userId: string) {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  },
};
