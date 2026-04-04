import { supabase } from '../../lib/supabase';
import { TagWithMac } from './tagsService';
import { fetchAddressFromNominatim } from '../geocoding';
import { AppState } from 'react-native';

// Cache para cooldown (Tag ID -> Timestamp de última atualização local)
const updateCache: Record<string, number> = {};

export const trackingService = {
  /**
   * Verifica se pode atualizar a tag.
   * Cooldown de 5 minutos com app aberto e 10 minutos em segundo plano.
   */
  canUpdateTag(tagId: string): boolean {
    const lastUpdate = updateCache[tagId];
    if (!lastUpdate) return true;

    const now = Date.now();
    const isBackground = AppState.currentState.match(/inactive|background/);
    const cooldownMs = isBackground ? (10 * 60 * 1000) : (5 * 60 * 1000);

    return (now - lastUpdate) > cooldownMs;
  },

  /**
   * Marca imediatamente o cooldown para evitar race conditions com múltiplos pacotes.
   */
  lockTag(tagId: string) {
    updateCache[tagId] = Date.now();
  },

  /**
   * Remove o lock (útil se der erro ao capturar localização).
   */
  unlockTag(tagId: string) {
    delete updateCache[tagId];
  },

  /**
   * Atualiza a localização da tag no banco e insere histórico.
   */
  async updateTagLocation(
    tag: TagWithMac, 
    latitude: number, 
    longitude: number, 
    batteryLevel: number | null
  ): Promise<void> {
    
    try {
      console.log(`[trackingService] Atualizando tag ${tag.id}...`);
      const nowISO = new Date().toISOString();

      // Buscar endereço
      let endereco: string | null = null;
      try {
        endereco = await fetchAddressFromNominatim(latitude, longitude);
      } catch (err) {
        console.warn(`[trackingService] Erro ao buscar endereço (geocoding):`, err);
      }

      // Update public.tags
      const { error: updateError } = await supabase
        .from('tags')
        .update({
          ultima_lat: latitude,
          ultima_lng: longitude,
          ultima_comunicacao: nowISO,
          ...(batteryLevel !== null ? { battery: batteryLevel } : {})
        })
        .eq('id', tag.id);

      if (updateError) {
        console.error('[trackingService] Erro no UPDATE em public.tags:', updateError);
        return; // Falha grave
      }
      console.log('[trackingService] Update na tabela tags realizado com sucesso.');

      // Insert public.historico_tags
      const { error: insertError } = await supabase
        .from('historico_tags')
        .insert({
          tag_id: tag.id,
          latitude,
          longitude,
          data_hora: nowISO,
          endereco: endereco || '',
          battery: batteryLevel !== null ? batteryLevel : tag.battery,
          is_bluetooth: true,
        });

      if (insertError) {
        console.error('[trackingService] Erro no INSERT em public.historico_tags:', insertError);
      } else {
        console.log('[trackingService] Insert em historico_tags realizado com sucesso.');
      }

      // Atualiza o cache local de cooldown
      updateCache[tag.id] = Date.now();

    } catch (err) {
      console.error('[trackingService] Erro inesperado ao salvar tracking:', err);
    }
  }
};
