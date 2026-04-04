import { supabase } from '../../lib/supabase';

export interface TagWithMac {
  id: string;
  usuario_id: string;
  codigo: string;
  mac: string;
  ultima_lat: number | null;
  ultima_lng: number | null;
  ultima_comunicacao: string | null;
  endereco: string | null;
  status: string | null;
  battery: number | null;
}

export const tagsService = {
  async getTagsWithMac(userId: string): Promise<TagWithMac[]> {
    console.log('[tagsService] Consultando tags com MAC...');
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('usuario_id', userId)
        .not('mac', 'is', null)
        .neq('mac', '')
        .neq('mac', '0')
        .eq('delet', false);

      if (error) {
        console.error('[tagsService] Erro ao buscar tags:', error);
        return [];
      }

      const tags = (data || []) as TagWithMac[];
      
      if (tags.length === 0) {
        console.log('[tagsService] Nenhuma tag com MAC encontrada.');
      } else {
        console.log(`[tagsService] ${tags.length} tag(s) com MAC encontrada(s).`);
      }

      return tags;
    } catch (err) {
      console.error('[tagsService] Exceção ao buscar tags:', err);
      return [];
    }
  }
};
