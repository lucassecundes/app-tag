// Send push notifications to admin users when new orders or abandoned carts are created
// Usage: Call this function from database triggers

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface NotificationPayload {
    type: 'new_order' | 'new_abandoned_cart';
    data: {
        id: string;
        customerName?: string;
        customerEmail?: string;
        totalAmount?: number;
        productName?: string;
    };
}

serve(async (req) => {
    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        const payload: NotificationPayload = await req.json();

        console.log('Received notification payload:', payload);

        // Fetch all admin users with push tokens
        const { data: admins, error: adminsError } = await supabase
            .from('usuario')
            .select('expo_push_token')
            .eq('role', 'admin')
            .not('expo_push_token', 'is', null);

        if (adminsError) {
            console.error('Error fetching admin users:', adminsError);
            throw adminsError;
        }

        if (!admins || admins.length === 0) {
            console.log('No admin users with push tokens found');
            return new Response(
                JSON.stringify({ message: 'No admin users with push tokens' }),
                { headers: { 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        console.log(`Found ${admins.length} admin users with push tokens`);

        // Prepare notification message
        let title = '';
        let body = '';
        let data = {};

        if (payload.type === 'new_order') {
            title = '🛒 Novo Pedido!';
            body = `Novo pedido de ${payload.data.customerName || payload.data.customerEmail || 'cliente'}`;
            if (payload.data.totalAmount) {
                body += ` - R$ ${payload.data.totalAmount.toFixed(2)}`;
            }
            data = {
                type: 'order',
                orderId: payload.data.id,
                screen: `/admin/orders/${payload.data.id}`,
            };
        } else if (payload.type === 'new_abandoned_cart') {
            title = '🛍️ Carrinho Abandonado';
            body = `${payload.data.customerName || payload.data.customerEmail || 'Cliente'} abandonou um carrinho`;
            if (payload.data.productName) {
                body += ` - ${payload.data.productName}`;
            }
            data = {
                type: 'abandoned_cart',
                cartId: payload.data.id,
                screen: `/admin/carts/${payload.data.id}`,
            };
        }

        // Send notifications to all admin users
        const messages = admins
            .filter((admin: any) => admin.expo_push_token)
            .map((admin: any) => ({
                to: admin.expo_push_token,
                sound: 'default',
                title,
                body,
                data,
                priority: 'high',
                channelId: 'admin-notifications',
            }));

        console.log(`Sending ${messages.length} notifications`);

        // Send to Expo Push API
        const response = await fetch(EXPO_PUSH_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json();
        console.log('Expo push response:', result);

        return new Response(
            JSON.stringify({
                success: true,
                adminCount: admins.length,
                notificationsSent: messages.length,
                result
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error sending admin notifications:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            { headers: { 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
