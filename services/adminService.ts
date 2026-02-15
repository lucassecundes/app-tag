// Admin service - Handles all admin-related data fetching and operations

import { supabase } from '../lib/supabase';

export interface DashboardStats {
    totalOrders: number;
    abandonedCarts: number;
    totalClients: number;
    activeTags: number;
    ordersByStatus: {
        pending: number;
        confirmed: number;
        received: number;
    };
    salesHistory: { date: string; value: number; label: string }[];
    salesToday: number;
    salesGrowth: number;
}

export interface OrderListItem {
    id: string;
    customer_name: string | null;
    customer_email: string | null;
    payment_status: string | null;
    total_amount: number | null;
    created_at: string | null;
    quantity: number | null;
}

export interface OrderDetails extends OrderListItem {
    customer_phone: string | null;
    customer_cpf_cnpj: string | null;
    payment_method: string | null;
    shipping_address: any;
    shipping_amount: number | null;
    shipping_method: string | null;
    shipping_carrier: string | null;
    estimated_delivery_days: number | null;
    discount: number | null;
    metadata: any;
    order_items: OrderItem[];
    coupon?: CouponInfo | null;
}

export interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface CouponInfo {
    id: string;
    token: string;
    percent: number;
    purpose: string;
}

export interface AbandonedCartListItem {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    status: string | null;
    created_at: string | null;
    product_name?: string;
}

export interface AbandonedCartDetails extends AbandonedCartListItem {
    metadata: any;
    product?: {
        id: string;
        name: string | null;
        price: number | null;
        image_url: string | null;
    };
}

/**
 * Fetch dashboard statistics for admin
 */
export async function getDashboardStats(days: number = 7): Promise<DashboardStats> {
    try {
        // Fetch total orders
        const { count: totalOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (ordersError) throw ordersError;

        // Fetch abandoned carts (pending only)
        const { count: abandonedCarts, error: cartsError } = await supabase
            .from('abandoned_carts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (cartsError) throw cartsError;

        // Fetch total clients (users with role = 'user')
        const { count: totalClients, error: clientsError } = await supabase
            .from('usuario')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'user');

        if (clientsError) throw clientsError;

        // Fetch active tags
        const { count: activeTags, error: tagsError } = await supabase
            .from('tags')
            .select('*', { count: 'exact', head: true })
            .eq('delet', false);

        if (tagsError) throw tagsError;

        // Fetch orders by status
        const { data: orderStatusData, error: statusError } = await supabase
            .from('orders')
            .select('payment_status');

        if (statusError) throw statusError;

        const ordersByStatus = {
            pending: orderStatusData?.filter(o => o.payment_status === 'PENDING').length || 0,
            confirmed: orderStatusData?.filter(o => o.payment_status === 'CONFIRMED').length || 0,
            received: orderStatusData?.filter(o => o.payment_status === 'RECEIVED').length || 0,
        };

        // Fetch sales history based on days parameter
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: salesData, error: salesError } = await supabase
            .from('orders')
            .select('created_at, total_amount')
            .gte('created_at', startDate.toISOString())
            .in('payment_status', ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH', 'REFUNDED_IN_CASH']) // Include only successful payments
            .order('created_at', { ascending: true });

        if (salesError) throw salesError;

        // Process sales history
        const salesHistoryMap = new Map<string, number>();
        let todaySales = 0;
        let yesterdaySales = 0;

        // Helper for local date string (YYYY-MM-DD)
        const getLocalDateStr = (d: Date) => {
            return d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
        };

        const todayStr = getLocalDateStr(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);

        // Fill map with all dates in range to ensure continuous line
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = getLocalDateStr(d);
            salesHistoryMap.set(dateStr, 0);
        }

        salesData?.forEach(order => {
            const orderDate = new Date(order.created_at);
            const date = getLocalDateStr(orderDate);
            const amount = Number(order.total_amount || 0);

            // Only add if within range (though query already filters, good for safety)
            if (salesHistoryMap.has(date)) {
                salesHistoryMap.set(date, (salesHistoryMap.get(date) || 0) + amount);
            }

            if (date === todayStr) {
                todaySales += amount;
            } else if (date === yesterdayStr) {
                yesterdaySales += amount;
            }
        });

        // Format for chart and sort by date
        const salesHistory = Array.from(salesHistoryMap.entries())
            .map(([date, value]) => ({
                date,
                value,
                label: date.split('-')[2] + '/' + date.split('-')[1]
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate growth
        const salesGrowth = yesterdaySales > 0
            ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
            : 0;

        return {
            totalOrders: totalOrders || 0,
            abandonedCarts: abandonedCarts || 0,
            totalClients: totalClients || 0,
            activeTags: activeTags || 0,
            ordersByStatus,
            salesHistory,
            salesToday: todaySales,
            salesGrowth
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}

/**
 * Fetch orders list with optional filtering and pagination
 */
export async function getOrders(params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<OrderListItem[]> {
    try {
        let query = supabase
            .from('orders')
            .select('id, customer_name, customer_email, payment_status, total_amount, created_at, quantity')
            .order('created_at', { ascending: false });

        if (params?.search) {
            query = query.or(`customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%`);
        }

        if (params?.status) {
            query = query.eq('payment_status', params.status);
        }

        if (params?.limit) {
            query = query.limit(params.limit);
        }

        if (params?.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
}

/**
 * Fetch single order with all details
 */
export async function getOrderById(id: string): Promise<OrderDetails | null> {
    try {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (orderError) throw orderError;
        if (!order) return null;

        // Fetch order items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', id);

        if (itemsError) throw itemsError;

        // Fetch coupon if exists
        let coupon = null;
        if (order.coupon_id) {
            const { data: couponData, error: couponError } = await supabase
                .from('coupons')
                .select('id, token, percent, purpose')
                .eq('id', order.coupon_id)
                .single();

            if (!couponError && couponData) {
                coupon = couponData;
            }
        }

        return {
            ...order,
            order_items: items || [],
            coupon,
        };
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
}

/**
 * Fetch abandoned carts list
 */
export async function getAbandonedCarts(params?: {
    limit?: number;
    offset?: number;
}): Promise<AbandonedCartListItem[]> {
    try {
        let query = supabase
            .from('abandoned_carts')
            .select(`
        id, 
        email, 
        phone, 
        name, 
        status, 
        created_at,
        products(name)
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (params?.limit) {
            query = query.limit(params.limit);
        }

        if (params?.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map(cart => ({
            ...cart,
            product_name: (cart as any).products?.name || 'N/A',
        }));
    } catch (error) {
        console.error('Error fetching abandoned carts:', error);
        throw error;
    }
}

/**
 * Fetch single abandoned cart with details
 */
export async function getAbandonedCartById(id: string): Promise<AbandonedCartDetails | null> {
    try {
        const { data: cart, error: cartError } = await supabase
            .from('abandoned_carts')
            .select('*')
            .eq('id', id)
            .single();

        if (cartError) throw cartError;
        if (!cart) return null;

        // Fetch product details if product_id exists
        let product = null;
        if (cart.product_id) {
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('id, name, price, image_url')
                .eq('id', cart.product_id)
                .single();

            if (!productError && productData) {
                product = productData;
            }
        }

        return {
            ...cart,
            product,
        };
    } catch (error) {
        console.error('Error fetching abandoned cart:', error);
        throw error;
    }
}

/**
 * Update abandoned cart status
 */
export async function updateCartStatus(id: string, status: 'recovered' | 'ignored'): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('abandoned_carts')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error updating cart status:', error);
        throw error;
    }
}
