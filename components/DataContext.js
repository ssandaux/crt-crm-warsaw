import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { pushEvent } from '../lib/dataStore';

const DataContext = createContext(null);

// DB (snake_case) → JS (camelCase)
function fromDB(row) {
  return {
    ...row,
    lastAction: row.last_action,
    followUpDate: row.follow_up_date ?? null,
  };
}

// JS fields → DB columns (only known fields)
function toDB(obj) {
  const map = {
    name: 'name', type: 'type', district: 'district', status: 'status',
    address: 'address', phone: 'phone', email: 'email', website: 'website',
    note: 'note', lat: 'lat', lng: 'lng',
    lastAction: 'last_action', followUpDate: 'follow_up_date',
  };
  const result = {};
  for (const [js, db] of Object.entries(map)) {
    if (js in obj) result[db] = obj[js];
  }
  return result;
}

export function DataProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase
      .from('businesses')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data }) => {
        setBusinesses((data || []).map(fromDB));
        setReady(true);
      });
  }, []);

  function isDuplicate(name, address, excludeId = null) {
    const norm = (s) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    const n = norm(name);
    const a = norm(address);
    const hasAddress = a && a !== '—';
    return businesses.some((b) => {
      if (excludeId && b.id === excludeId) return false;
      if (norm(b.name) !== n) return false;
      if (!hasAddress) return false;
      return norm(b.address) === a;
    });
  }

  async function addBusiness(biz) {
    if (isDuplicate(biz.name, biz.address)) return null;
    const today = new Date().toISOString().slice(0, 10);
    const row = toDB({ ...biz, lastAction: today });
    const { data, error } = await supabase
      .from('businesses')
      .insert(row)
      .select()
      .single();
    if (error || !data) return null;
    const newBiz = fromDB(data);
    setBusinesses((prev) => [...prev, newBiz]);
    pushEvent('added', newBiz.name, newBiz.status);
    return newBiz;
  }

  async function updateBusiness(id, changes) {
    const today = new Date().toISOString().slice(0, 10);
    const row = toDB({ ...changes, lastAction: today });
    const { data, error } = await supabase
      .from('businesses')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return;
    const updated = fromDB(data);
    setBusinesses((prev) => prev.map((b) => (b.id === id ? updated : b)));
    pushEvent('updated', updated.name, changes.status ?? updated.status);
  }

  async function deleteBusiness(id) {
    const biz = businesses.find((b) => b.id === id);
    await supabase.from('businesses').delete().eq('id', id);
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    if (biz) pushEvent('deleted', biz.name, 'removed');
  }

  async function deleteBusinesses(ids) {
    await supabase.from('businesses').delete().in('id', ids);
    setBusinesses((prev) => prev.filter((b) => !ids.includes(b.id)));
    pushEvent('bulk_delete', `${ids.length} businesses`, 'removed');
  }

  async function changeStatus(id, status) {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('businesses').update({ status, last_action: today }).eq('id', id);
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, status, lastAction: today } : b)));
    const biz = businesses.find((b) => b.id === id);
    if (biz) pushEvent('status', biz.name, status);
  }

  async function bulkChangeStatus(ids, status) {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('businesses').update({ status, last_action: today }).in('id', ids);
    setBusinesses((prev) => prev.map((b) => (ids.includes(b.id) ? { ...b, status, lastAction: today } : b)));
    pushEvent('bulk_status', `${ids.length} businesses`, status);
  }

  return (
    <DataContext.Provider value={{
      businesses, ready,
      addBusiness, updateBusiness,
      deleteBusiness, deleteBusinesses,
      changeStatus, bulkChangeStatus,
      isDuplicate,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
