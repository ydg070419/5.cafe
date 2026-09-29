import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CafeMenuRow {
  id: number;
  created_at: string;
  customer_name: string;
  phone_number: string | null;
  drink_name: string;
  drink_price: number;
  size: 'S' | 'M' | 'L' | string;
  size_price: number;
  options: string[];
  options_price: number;
  quantity: number;
  requests: string | null;
  total_price: number;
  order_status: '접수완료' | '제조중' | '완료' | string;
}

export type InsertCafeMenu = {
  customer_name: string;
  phone_number?: string | null;
  drink_name: string;
  drink_price: number;
  size: 'S' | 'M' | 'L' | string;
  size_price: number;
  options: string[];
  options_price: number;
  quantity: number;
  requests?: string | null;
  total_price: number;
  order_status?: string;
};

const STORAGE_KEY_URL = 'vibe_cafe_supabase_url';
const STORAGE_KEY_KEY = 'vibe_cafe_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  source: 'env' | 'localStorage' | 'none';
} {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && !envUrl.includes('YOUR_SUPABASE_URL')) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  if (typeof window !== 'undefined') {
    const localUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    const localKey = (localStorage.getItem(STORAGE_KEY_KEY) || '').trim();
    if (localUrl && localKey) {
      return { url: localUrl, anonKey: localKey, source: 'localStorage' };
    }
  }

  return { url: '', anonKey: '', source: 'none' };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  }
  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey);
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tableExists: boolean;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      tableExists: false,
      message: 'Supabase URL과 Anon Key가 설정되지 않았습니다.',
    };
  }

  try {
    const { data, error } = await client
      .from('cafe_menu')
      .select('id')
      .limit(1);

    if (error) {
      // If table doesn't exist or RLS issue
      if (error.code === '42P01') {
        return {
          connected: true,
          tableExists: false,
          message: 'Supabase에는 연결되었으나 cafe_menu 테이블이 존재하지 않습니다. SQL 쿼리를 실행해 주세요.',
        };
      }
      return {
        connected: false,
        tableExists: false,
        message: `연결 오류: ${error.message} (${error.code || ''})`,
      };
    }

    return {
      connected: true,
      tableExists: true,
      message: 'Supabase 및 cafe_menu 테이블이 정상적으로 연결되었습니다.',
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: `연결 실패: ${err?.message || '네트워크 오류'}`,
    };
  }
}

export async function fetchOrders(): Promise<{
  data: CafeMenuRow[];
  error: any;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: [], error: new Error('Supabase client not initialized') };
  }

  const { data, error } = await client
    .from('cafe_menu')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { data: [], error };
  }

  return { data: data as CafeMenuRow[], error: null };
}

export async function createOrder(order: InsertCafeMenu): Promise<{
  data: CafeMenuRow | null;
  error: any;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: new Error('Supabase client not initialized') };
  }

  const { data, error } = await client
    .from('cafe_menu')
    .insert([order])
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    return { data: null, error };
  }

  return { data: data as CafeMenuRow, error: null };
}

export async function updateOrderStatus(
  id: number,
  orderStatus: string
): Promise<{ success: boolean; error: any }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }

  const { error } = await client
    .from('cafe_menu')
    .update({ order_status: orderStatus })
    .eq('id', id);

  if (error) {
    console.error('Error updating order status:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

export async function deleteOrder(id: number): Promise<{ success: boolean; error: any }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }

  const { error } = await client.from('cafe_menu').delete().eq('id', id);

  if (error) {
    console.error('Error deleting order:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

export function subscribeToOrders(onChanges: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  const channel = client
    .channel('cafe_menu_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cafe_menu' },
      () => {
        onChanges();
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
