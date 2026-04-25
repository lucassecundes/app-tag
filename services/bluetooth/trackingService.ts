import { supabase } from '../../lib/supabase';
import { TagWithMac } from './tagsService';
import { fetchAddressFromNominatim } from '../geocoding';

// Cache para cooldown (Tag ID -> Timestamp de última atualização local)
const updateCache: Record<string, number> = {};
const updateCacheBg: Record<string, number> = {};

// Cooldown fixo de 5 minutos (apenas foreground)
const COOLDOWN_MS = 5 * 60 * 1000;
// Cooldown fixo de 10 minutos (background)
const COOLDOWN_BG_MS = 10 * 60 * 1000;

export const trackingService = {
  /**
   * Verifica se pode atualizar a tag.
   * Cooldown de 5 minutos (o scan só ocorre com o app em foreground).
   */
  canUpdateTag(tagId: string): boolean {
    const lastUpdate = updateCache[tagId];
    if (!lastUpdate) return true;

    return (Date.now() - lastUpdate) > COOLDOWN_MS;
  },

  canUpdateTagBackground(tagId: string): boolean {
    const lastUpdate = updateCacheBg[tagId];
    if (!lastUpdate) return true;

    return (Date.now() - lastUpdate) > COOLDOWN_BG_MS;
  },

  /**
   * Marca imediatamente o cooldown para evitar race conditions com múltiplos pacotes.
   */
  lockTag(tagId: string) {
    updateCache[tagId] = Date.now();
  },

  lockTagBackground(tagId: string) {
    updateCacheBg[tagId] = Date.now();
  },

  /**
   * Remove o lock (útil se der erro ao capturar localização).
   */
  unlockTag(tagId: string) {
    delete updateCache[tagId];
  },

  unlockTagBackground(tagId: string) {
    delete updateCacheBg[tagId];
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
