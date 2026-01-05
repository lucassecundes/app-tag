import { supabase } from '../lib/supabase';

export interface PlanActivationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const PlanService = {
  /**
   * Ativa o plano anual para um dispositivo.
   * Endpoint simulado: POST /api/device/activate
   */
  async activateDevice(userId: string, deviceId: string): Promise<PlanActivationResult> {
    try {
      console.log('Iniciando ativação de plano:', { userId, deviceId });

      const { data, error } = await supabase.rpc('activate_device', {
        p_user_id: userId,
        p_device_id: deviceId,
      });

      if (error) {
        console.error('Erro na ativação:', error);
        throw error;
      }

      console.log('Plano ativado com sucesso:', data);

      // Simulação de envio de e-mail
      await this.sendConfirmationEmail(userId, deviceId, data);

      return { success: true, data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erro ao ativar o plano.' 
      };
    }
  },

  async sendConfirmationEmail(userId: string, deviceId: string, planData: any) {
    // Simulação de chamada de API de e-mail
    console.log('--- EMAIL DE CONFIRMAÇÃO ---');
    console.log(`Para: Usuário ${userId}`);
    console.log(`Assunto: Confirmação de Plano Anual - Device ${deviceId}`);
    console.log(`Detalhes: Seu plano foi ativado em ${planData.activation_date} e expira em ${planData.expiration_date}.`);
    console.log('----------------------------');
    
    // Aqui poderia ser uma chamada para uma Edge Function:
    // await supabase.functions.invoke('send-email', { body: { ... } })
  },

  async getDevicePlan(deviceId: string) {
    const { data, error } = await supabase
      .from('plans_assinar')
      .select('*, planos (checkout_url)')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 é "não encontrado"
      console.error('Erro ao buscar plano:', error);
      return null;
    }

    return data;
  }
};
