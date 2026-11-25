import React, { useState, useEffect } from 'react';
import { useSchool } from '../hooks/useSchool';
import { User, School } from '../types';
import { apiFetch } from '../apiFetch';
import { Building, ShieldCheck, Plus, Sparkles, AlertCircle, Database, CloudLightning, RefreshCw } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { schoolsList, createSchool, refresh } = useSchool(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [region, setRegion] = useState('Greater Accra');
  const [multiStream, setMultiStream] = useState(false);
  const [passMark, setPassMark] = useState(50);
  
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [usersCount, setUsersCount] = useState(0);

  // Backup Telemetry States
  const [firebaseStatus, setFirebaseStatus] = useState<any>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const status = await apiFetch('/api/firebase/status');
      setFirebaseStatus(status);
    } catch (e) {
      console.error('Failed to fetch Firebase status', e);
    }
  };

  const fetchUsersCount = async () => {
    try {
      const data = await apiFetch('/api/data');
      if (data && data.users) {
        setUsersCount(data.users.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchUsersCount();
  }, [schoolsList]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const result = await createSchool({
      name,
      code: code.toUpperCase(),
      region,
      multiStreamMode: multiStream,
      passMark: Number(passMark)
    });

    if (result && result.success) {
      setName('');
      setCode('');
      setMultiStream(false);
      setPassMark(50);
      setMsgType('success');
      setMsg(`New school node "${name}" provisioned. Created admin user: ${result.adminUser?.username}`);
    } else {
      setMsgType('danger');
      setMsg('Failed to provision school node.');
    }
    setTimeout(() => setMsg(''), 6000);
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const result = await apiFetch('/api/firebase/push', { method: 'POST' });
      setMsgType('success');
      setMsg(result.message || 'Backup completed successfully.');
      fetchTelemetry();
    } catch (err: any) {
      setMsgType('danger');
      setMsg(err.message || 'Backup failed.');
    } finally {
      setBackingUp(false);
      setTimeout(() => setMsg(''), 6000);
    }
  };

  const handleRestore = async () => {
    if (!confirm('Are you sure you want to pull cloud backup and overwrite local cache school_data.json?')) return;
    setRestoring(true);
    try {
      const result = await apiFetch('/api/firebase/pull', { method: 'POST' });
      setMsgType('success');
      setMsg(result.message || 'Restoration complete.');
      refresh();
    } catch (err: any) {
      setMsgType('danger');
      setMsg(err.message || 'Restoration failed.');
    } finally {
      setRestoring(false);
      setTimeout(() => setMsg(''), 6000);
    }
  };

  const handleFactoryReset = async () => {
    if (!confirm('WARNING: This will flash the database and restore default schools/users/assessments. Proceed?')) return;
    setResetting(true);
    try {
      const result = await apiFetch('/api/factory-reset', { method: 'POST' });
      setMsgType('success');
      setMsg(result.message || 'Factory reset completed.');
      refresh();
    } catch (err: any) {
      setMsgType('danger');
      setMsg(err.message || 'Reset failed.');
    } finally {
      setResetting(false);
      setTimeout(() => setMsg(''), 6000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">MoE Global Control Center</h1>
        <p className="text-sm text-slate-500">Ministry of Education - Federated Cloud Node Partition</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Federated Districts</div>
            <div className="text-2xl font-bold mt-2">{schoolsList.length} Nodes</div>
          </div>
          <div className="p-3 bg-[#0d5c41]/10 text-[#0d5c41] rounded-lg"><Building size={20} /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Global Registrations</div>
            <div className="text-2xl font-bold mt-2">{usersCount} Accounts</div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg"><ShieldCheck size={20} /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Backup Latency</div>
            <div className="text-2xl font-bold mt-2 text-emerald-500">
              {firebaseStatus?.latencyMs ? `${firebaseStatus.latencyMs} ms` : 'Active'}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><CloudLightning size={20} /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Database Storage</div>
            <div className="text-2xl font-bold mt-2 text-blue-500">JSON Relational</div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Database size={20} /></div>
        </div>
      </div>

      {msg && (
        <div className={`text-xs p-3 rounded-lg border font-medium ${
          msgType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#0d5c41]">
              <Plus size={18} />
              Provision New School Node
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accra High School"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#0d5c41] rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AHS01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#0d5c41] rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none transition"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Ghana Region
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#0d5c41] rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none transition"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <option value="Greater Accra">Greater Accra</option>
                    <option value="Ashanti">Ashanti</option>
                    <option value="Western">Western</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Northern">Northern</option>
                    <option value="Volta">Volta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Pass Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={80}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#0d5c41] rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none transition"
                    value={passMark}
                    onChange={(e) => setPassMark(Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-[#0d5c41] focus:ring-0"
                      checked={multiStream}
                      onChange={(e) => setMultiStream(e.target.checked)}
                    />
                    Multi-Stream Mode
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0d5c41] hover:bg-[#0a4632] text-white font-bold rounded-lg transition text-sm shadow-sm"
              >
                Provision School Node
              </button>
            </form>
          </div>

          {/* Backup & System Maintenance Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
              <Database size={18} />
              Telemetry & Backups
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-2 text-slate-700 dark:text-slate-300">
                <p><strong>Cloud Backup Nodes:</strong> {firebaseStatus?.activeBackupNodes || 0} items backed up</p>
                <p><strong>Synchronized status:</strong> Connected to Cloud Nodes</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={handleBackup}
                  disabled={backingUp}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-center disabled:opacity-50"
                >
                  {backingUp ? 'Pushing...' : 'Push Cloud Sync'}
                </button>
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-center disabled:opacity-50"
                >
                  {restoring ? 'Restoring...' : 'Restore Cloud Sync'}
                </button>
              </div>

              <button
                onClick={handleFactoryReset}
                disabled={resetting}
                className="w-full py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg transition text-xs font-bold"
              >
                {resetting ? 'Resetting...' : 'Execute Factory Database Reset'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Listing */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4">Federated School Nodes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3">District School</th>
                    <th className="pb-3">Region</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {schoolsList.map((sch) => (
                    <tr key={sch.id} className="text-slate-800 dark:text-slate-300">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{sch.name}</td>
                      <td className="py-3">{sch.region}</td>
                      <td className="py-3"><code>{sch.code}</code></td>
                      <td className="py-3 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 mr-1.5">
                          Pass: {sch.passMark}%
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded ${sch.multiStreamMode ? 'bg-[#0d5c41]/10 text-[#0d5c41]' : 'bg-blue-500/10 text-blue-500'}`}>
                          {sch.multiStreamMode ? 'Multi-Str' : 'Single'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {schoolsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-500">
                        No school nodes configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
