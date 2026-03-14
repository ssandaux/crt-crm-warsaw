import { createContext, useContext, useState, useEffect } from 'react';
import { loadBusinesses, saveBusinesses, pushEvent } from '../lib/dataStore';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBusinesses(loadBusinesses());
    setReady(true);
  }, []);

  function persist(updated) {
    setBusinesses(updated);
    saveBusinesses(updated);
  }

  function isDuplicate(name, address) {
    const norm = (s) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    const n = norm(name);
    const a = norm(address);
    const hasAddress = a && a !== '—';
    return businesses.some((b) => {
      if (norm(b.name) !== n) return false;
      if (!hasAddress) return false; // name-only match not enough
      return norm(b.address) === a;
    });
  }

  function addBusiness(biz) {
    if (isDuplicate(biz.name, biz.address)) return null; // silently reject duplicate
    const newId = businesses.length > 0 ? Math.max(...businesses.map((b) => b.id)) + 1 : 1;
    const today = new Date().toISOString().slice(0, 10);
    const newBiz = { ...biz, id: newId, lastAction: today };
    persist([...businesses, newBiz]);
    pushEvent('added', newBiz.name, newBiz.status);
    return newBiz;
  }

  function updateBusiness(id, changes) {
    const today = new Date().toISOString().slice(0, 10);
    const updated = businesses.map((b) => (b.id === id ? { ...b, ...changes, lastAction: today } : b));
    persist(updated);
    const biz = updated.find((b) => b.id === id);
    pushEvent('updated', biz.name, changes.status ?? biz.status);
  }

  function deleteBusiness(id) {
    const biz = businesses.find((b) => b.id === id);
    persist(businesses.filter((b) => b.id !== id));
    if (biz) pushEvent('deleted', biz.name, 'removed');
  }

  function deleteBusinesses(ids) {
    persist(businesses.filter((b) => !ids.includes(b.id)));
    pushEvent('bulk_delete', `${ids.length} businesses`, 'removed');
  }

  function changeStatus(id, status) {
    const today = new Date().toISOString().slice(0, 10);
    const updated = businesses.map((b) => (b.id === id ? { ...b, status, lastAction: today } : b));
    persist(updated);
    const biz = updated.find((b) => b.id === id);
    pushEvent('status', biz.name, status);
  }

  function bulkChangeStatus(ids, status) {
    const today = new Date().toISOString().slice(0, 10);
    persist(businesses.map((b) => (ids.includes(b.id) ? { ...b, status, lastAction: today } : b)));
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
