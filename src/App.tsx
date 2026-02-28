import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Radar,
  Archive,
  Settings,
  User,
  Flame,
  Thermometer,
  RefreshCw,
  Briefcase,
  MapPin,
  Activity,
  MessageSquare,
  BrainCircuit,
  Send,
  LayoutDashboard,
  Search,
  Filter,
  TrendingUp,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  Globe,
  Building2,
  Landmark,
  Linkedin,
  ChevronDown,
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import type { Signal, DashboardStats, RadarSettings, RadarSource } from './types';
import * as api from './api';

type Tab = 'dashboard' | 'leads' | 'archive' | 'settings' | 'profile';

const RADAR_CONFIG: Record<RadarSource, { label: string; icon: React.ReactNode; color: string }> = {
  borme: { label: 'BORME', icon: <Landmark className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
  traspasos: { label: 'Traspasos', icon: <Building2 className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50' },
  inmobiliario: { label: 'Inmobiliario', icon: <Globe className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
  linkedin: { label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, color: 'text-sky-600 bg-sky-50' },
};

// ===== Toast Notification =====
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />,
    info: <Radar className="w-4 h-4 text-blue-600" />,
  };
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${colors[type]} animate-in slide-in-from-right`}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
    </div>
  );
}

// Ensure react-router imports exist
import { Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import Login from './Login';

// Protected Route Component
function ProtectedRoute({ children, isAuthenticated }: { children: React.ReactNode, isAuthenticated: boolean }) {
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('vantage_token'));

  const handleLogin = (token: string) => {
    localStorage.setItem('vantage_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('vantage_token');
    setIsAuthenticated(false);
  };

  const [signals, setSignals] = useState<Signal[]>([]);
  const [archivedSignals, setArchivedSignals] = useState<Signal[]>([]);
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<RadarSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [scanFilter, setScanFilter] = useState<RadarSource[]>([]);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const activeSignal = signals.find(s => s.id === activeSignalId) || null;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  }, []);

  // ===== Load Data =====
  const loadSignals = useCallback(async () => {
    try {
      const data = await api.fetchSignals();
      setSignals(data.signals);
      if (data.signals.length > 0 && !activeSignalId) {
        setActiveSignalId(data.signals[0].id);
      }
    } catch (err) {
      console.error('Error loading signals:', err);
    }
  }, [activeSignalId]);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.fetchStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  const loadArchived = useCallback(async () => {
    try {
      const data = await api.fetchArchivedSignals();
      setArchivedSignals(data.signals);
    } catch (err) {
      console.error('Error loading archived:', err);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.fetchSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadSignals();
      loadArchived();
      loadSettings();
    }
  }, [isAuthenticated]);

  const [formLeadType, setFormLeadType] = useState('borme');
  const [targetCount, setTargetCount] = useState<number>(3);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'dashboard';

  // Find selected radar from URL if we are in leads tab
  const pathParts = location.pathname.split('/');
  const selectedRadarTab = (pathParts[1] === 'leads' && pathParts[2]) ? (pathParts[2] as RadarSource) : null;
  const setSelectedRadarTab = (radar: RadarSource | null) => {
    if (radar) {
      navigate(`/leads/${radar}`);
    } else {
      navigate('/leads');
    }
  };

  // ===== Actions =====
  const handleLaunchTargetedSearch = async () => {
    setIsScanning(true);
    abortControllerRef.current = new AbortController();
    try {
      // The form dropdown itself is selecting a specific radar
      const targetRadars = scanFilter.length > 0 ? scanFilter : [(formLeadType as RadarSource)];
      // Keywords are left to either settings or a specific input if we had one
      const keywords = ['España'];

      // We use triggerScan passing these explicitly
      const result = await api.triggerScan(
        targetRadars,
        keywords,
        targetCount,
        abortControllerRef.current.signal
      );
      showToast(`Búsqueda IA completada: ${result.signalsFound} señales encontradas`, 'success');
      await loadSignals();
      await loadStats();
      setShowScanOptions(false);
      if (result.signals.length > 0) {
        setActiveSignalId(result.signals[0].id);
        navigate('/leads');
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('abort')) {
        showToast('Rastreo cancelado por el usuario', 'info');
      } else {
        showToast(`Error en la búsqueda: ${err.message}`, 'error');
      }
    } finally {
      setIsScanning(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSignals();
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.searchSignals(searchQuery);
      setSignals(data.results);
      if (data.results.length > 0) {
        setActiveSignalId(data.results[0].id);
        navigate('/leads');
      }
      showToast(`${data.total} resultados para "${searchQuery}"`, 'info');
    } catch (err: any) {
      showToast(`Error buscando: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeSignal) return;
    setIsRegenerating(true);
    try {
      const result = await api.regenerateMessage(activeSignal.id);
      setSignals(prev => prev.map(s => s.id === activeSignal.id ? { ...s, draftMessage: result.draftMessage } : s));
      showToast('Mensaje regenerado con nuevo ángulo', 'success');
    } catch (err: any) {
      showToast(`Error regenerando: ${err.message}`, 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleArchive = async () => {
    if (!activeSignal) return;
    try {
      await api.archiveSignal(activeSignal.id);
      setSignals(prev => prev.filter(s => s.id !== activeSignal.id));
      showToast(`${activeSignal.name} movido al archivo`, 'success');
      if (signals.length > 1) {
        const next = signals.find(s => s.id !== activeSignal.id);
        setActiveSignalId(next?.id || null);
      } else {
        setActiveSignalId(null);
      }
      loadStats();
    } catch (err: any) {
      showToast(`Error archivando: ${err.message}`, 'error');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      showToast('Configuración guardada', 'success');
    } catch (err: any) {
      showToast(`Error guardando: ${err.message}`, 'error');
    }
  };

  const toggleRadarFilter = (radar: RadarSource) => {
    setScanFilter(prev =>
      prev.includes(radar) ? prev.filter(r => r !== radar) : [...prev, radar]
    );
  };

  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />} />
      <Route path="/*" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Sidebar */}
            <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 justify-between z-10">
              <div className="flex flex-col gap-8 w-full items-center">
                <div className="relative group">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm mb-4 cursor-pointer">
                    <Radar className="text-white w-5 h-5" />
                  </div>
                  <div className="absolute left-full ml-4 top-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity font-medium tracking-wide">
                    Vantage Intelligence
                  </div>
                </div>

                <nav className="flex flex-col gap-6 w-full items-center">
                  {([
                    { tab: 'dashboard' as Tab, icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard Principal', path: '/dashboard' },
                    { tab: 'leads' as Tab, icon: <span className="text-xl leading-none">👥</span>, label: 'Leads', path: '/leads' },
                    { tab: 'archive' as Tab, icon: <Archive className="w-5 h-5" />, label: 'Archivo', path: '/archive' },
                  ]).map(({ tab, icon, label, path }) => (
                    <Link
                      key={tab}
                      to={path}
                      className={`p-3 rounded-xl relative group transition-colors flex ${activeTab === tab ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      {icon}
                      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                        {label}
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex flex-col gap-6 w-full items-center">
                <Link
                  to="/settings"
                  className={`p-3 rounded-xl relative group transition-colors flex ${activeTab === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <Settings className="w-5 h-5" />
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    Configuración
                  </div>
                </Link>
                <Link
                  to="/profile"
                  className={`p-3 rounded-xl relative group transition-colors flex ${activeTab === 'profile' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <User className="w-5 h-5" />
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    Perfil
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`p-3 rounded-xl relative group transition-colors text-red-400 hover:text-red-500 hover:bg-red-50`}
                >
                  <RotateCcw className="w-5 h-5" />
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    Cerrar Sesión
                  </div>
                </button>
              </div>
            </aside>

            <Routes>
              <Route path="/dashboard" element={
                <main className="flex-1 bg-white overflow-y-auto relative p-10">
                  <div className="max-w-5xl mx-auto">
                    <header className="mb-10 flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Dashboard Principal</h1>
                        <p className="text-slate-500">Radar de Inteligencia Competitiva — Detecta huellas digitales de transición empresarial.</p>
                      </div>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="Búsqueda rápida en BBDD..."
                          className="w-64 bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </header>

                    {/* Targeted Lead Generation Form */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-800 mb-10 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <BrainCircuit className="w-48 h-48 text-white" />
                      </div>

                      <div className="relative z-10">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-400" />
                          Iniciar Rastreo de Leads (España)
                        </h2>

                        <div className="mb-8 max-w-md gap-4 flex flex-col">
                          {/* Lead Type */}
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Transacción</label>
                            <div className="relative">
                              <select
                                value={formLeadType}
                                onChange={(e) => setFormLeadType(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-4 pr-10 text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-lg"
                              >
                                <option value="borme">BORME Intel</option>
                                <option value="traspasos">Mercado de Traspasos</option>
                                <option value="inmobiliario">Activos Industriales</option>
                                <option value="linkedin">LinkedIn Radar</option>
                              </select>
                              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          {/* Target Leads Counter */}
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Objetivo de Leads (Número)</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={targetCount}
                              onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-4 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-lg"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-700 pt-6">
                          {/* Radar Filter Selection */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-400">Radares activos:</span>
                            <div className="flex flex-wrap gap-2">
                              {(Object.keys(RADAR_CONFIG) as RadarSource[]).map(radar => (
                                <button
                                  key={radar}
                                  onClick={() => toggleRadarFilter(radar)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${scanFilter.length === 0 || scanFilter.includes(radar)
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                  {RADAR_CONFIG[radar].icon}
                                  {RADAR_CONFIG[radar].label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Launch/Stop Button */}
                          <div className="flex items-center gap-3">
                            {isScanning && (
                              <button
                                onClick={handleStopScan}
                                className="bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-3.5 rounded-xl font-semibold hover:bg-red-500/20 transition-colors cursor-pointer flex items-center gap-2"
                              >
                                <X className="w-5 h-5" />
                                Detener Rastreo
                              </button>
                            )}
                            <button
                              onClick={handleLaunchTargetedSearch}
                              disabled={isScanning}
                              className="bg-emerald-500 text-slate-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              {isScanning ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Analizando la red...
                                </>
                              ) : (
                                <>
                                  <Radar className="w-5 h-5" />
                                  Ejecutar Rastreo IA
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-slate-500">Total Leads Activos</h3>
                          <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="w-4 h-4" />
                          </span>
                        </div>
                        <p className="text-3xl font-semibold text-slate-900">{stats?.totalLeads ?? 0}</p>
                        <p className="text-sm text-slate-500 mt-2">En el radar</p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-slate-500">Oportunidades High-Ticket</h3>
                          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Flame className="w-4 h-4" />
                          </span>
                        </div>
                        <p className="text-3xl font-semibold text-slate-900">{stats?.highTicket ?? 0}</p>
                        <p className="text-sm text-slate-500 mt-2">Temperatura Alta</p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-slate-500">Nuevas Señales Hoy</h3>
                          <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Radar className="w-4 h-4" />
                          </span>
                        </div>
                        <p className="text-3xl font-semibold text-slate-900">{stats?.newToday ?? 0}</p>
                        <p className="text-sm text-slate-500 mt-2">Pendientes de revisión</p>
                      </div>
                    </div>

                    {/* Radar Source Breakdown */}
                    {stats && stats.totalLeads > 0 && (
                      <div className="mb-10">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Señales por Radar</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(Object.keys(RADAR_CONFIG) as RadarSource[]).map(radar => (
                            <div key={radar} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                              <div className={`flex items-center gap-2 text-sm font-medium ${RADAR_CONFIG[radar].color} px-2 py-1 rounded-md w-fit mb-2`}>
                                {RADAR_CONFIG[radar].icon}
                                {RADAR_CONFIG[radar].label}
                              </div>
                              <p className="text-2xl font-semibold text-slate-900">{stats.bySource[radar] || 0}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Searches */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Búsquedas Recientes</h3>
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                          {stats?.recentSearches && stats.recentSearches.length > 0 ? (
                            stats.recentSearches.map((search, i) => (
                              <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer" onClick={() => { setSearchQuery(search.query); handleSearch(); }}>
                                <div className="flex items-center gap-3">
                                  <Search className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm text-slate-700 font-medium">{search.query}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-slate-500">{search.results} resultados</span>
                                  <span className="text-xs text-slate-400">{new Date(search.date).toLocaleDateString('es-ES')}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-slate-400">
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No hay búsquedas recientes. Lanza un Scan para comenzar.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              } />

              {/* ==================== LEADS ==================== */}
              <Route path="/leads" element={
                <main className="flex-1 bg-slate-50 overflow-y-auto relative p-10">
                  <div className="max-w-7xl mx-auto">
                    <header className="mb-10">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Sistemas de Extracción</h1>
                      <p className="text-slate-500">Selecciona un nodo para acceder al pipeline de candidatos.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {(Object.keys(RADAR_CONFIG) as RadarSource[]).map((radar) => {
                        const isReady = settings?.[radar]?.enabled ?? true;
                        const count = stats?.bySource[radar] || 0;

                        let title = RADAR_CONFIG[radar].label;
                        let desc = '';
                        if (radar === 'linkedin') { title = 'LinkedIn Radar'; desc = 'Extracción masiva y segmentada de perfiles "A-Player" desde Sales Navigator.'; }
                        if (radar === 'borme') { title = 'BORME Intel'; desc = 'Monitorización de boletines oficiales para detectar disoluciones y liquidaciones.'; }
                        if (radar === 'traspasos') { title = 'Mercado Traspasos'; desc = 'Detección de negocios en proceso de traspaso o cese de operaciones.'; }
                        if (radar === 'inmobiliario') { title = 'Activos Industriales'; desc = 'Rastreo de ventas urgentes y subastas de naves y activos industriales.'; }

                        return (
                          <div key={radar} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500 hover:shadow-xl transition-all shadow-sm">
                            <div>
                              <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${radar === 'linkedin' ? 'bg-blue-50 text-blue-600' : radar === 'borme' ? 'bg-amber-50 text-amber-600' : radar === 'traspasos' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                                  {RADAR_CONFIG[radar].icon}
                                </div>
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 uppercase">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active Node
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                              <p className="text-sm text-slate-500 mb-8 leading-relaxed h-16">{desc}</p>
                            </div>

                            <div>
                              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                <div className="text-[10px] font-semibold text-slate-500 tracking-wider mb-2 uppercase">Scraped Today</div>
                                <div className="flex items-baseline gap-2 text-slate-900">
                                  <span className="text-3xl font-bold">{count}</span>
                                  <span className="text-xs text-emerald-600 flex items-center gap-1"><Zap className="w-3 h-3" /> Live</span>
                                </div>
                              </div>

                              <button
                                onClick={() => setSelectedRadarTab(radar)}
                                className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm
                          ${radar === 'linkedin' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:shadow-blue-600/40' :
                                    radar === 'borme' ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 hover:shadow-amber-600/40' :
                                      radar === 'traspasos' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40' :
                                        'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20 hover:shadow-purple-600/40'}`}
                              >
                                Abrir Pipeline <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </main>
              } />

              <Route path="/leads/:radarId" element={
                <main className="flex-1 bg-white flex flex-col font-sans overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-10">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedRadarTab(null)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Pipeline <span className="text-slate-500 text-sm font-normal">({signals.filter(s => s.source === selectedRadarTab).length})</span>
                      </h2>
                      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button className="px-3 py-1 bg-white rounded-md text-slate-700 shadow-sm border border-slate-200"><LayoutDashboard className="w-4 h-4" /></button>
                        <button className="px-3 py-1 text-slate-500 hover:text-slate-900"><div className="w-4 h-4 flex gap-0.5"><div className="w-1.5 bg-current rounded-sm" /><div className="w-1.5 bg-current rounded-sm" /></div></button>
                      </div>
                    </div>
                    <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-[2.5fr_2fr_1fr_3.5fr_1fr_0.5fr] gap-4 px-8 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold tracking-wider text-slate-500 uppercase">
                    <div>Candidato</div>
                    <div>Rol Actual</div>
                    <div>Estado</div>
                    <div>Mensaje</div>
                    <div className="flex items-center gap-1"><BrainCircuit className="w-3.5 h-3.5" /> Score</div>
                    <div className="text-right">Acciones</div>
                  </div>

                  <div className="flex-1 overflow-y-auto w-full relative">
                    {activeSignal ? (
                      /* Deep Analysis Modal */
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 overflow-y-auto border-t border-slate-200">
                        <button onClick={() => setActiveSignalId(null)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors cursor-pointer z-50">
                          <X className="w-6 h-6" />
                        </button>
                        <div className="max-w-4xl mx-auto px-10 py-12">
                          <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${RADAR_CONFIG[activeSignal.source].color} border`}>
                                {RADAR_CONFIG[activeSignal.source].icon}
                                {activeSignal.trigger}
                              </span>
                              <span className="text-sm text-slate-500 flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> {activeSignal.location}
                              </span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{activeSignal.name}</h2>
                            <p className="text-lg text-slate-600 flex items-center gap-2 font-medium">
                              <Briefcase className="w-5 h-5" />
                              {activeSignal.roleCompany}
                            </p>
                          </div>

                          <div className="mb-10">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Fuente Original
                            </h3>
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-slate-700 leading-relaxed text-base shadow-sm">
                              "{activeSignal.fullSource}"
                            </div>
                          </div>

                          <div className="mb-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden pointer-events-none">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                              <BrainCircuit className="w-40 h-40" />
                            </div>
                            <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-6 flex items-center gap-2">
                              <BrainCircuit className="w-4 h-4" />
                              Análisis Predictivo IA
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 pointer-events-auto">
                              <div>
                                <h4 className="text-emerald-100/80 text-sm mb-2 font-semibold">Intención Detectada</h4>
                                <p className="text-white text-base leading-relaxed font-medium">{activeSignal.aiAnalysis.intent}</p>
                              </div>
                              <div>
                                <h4 className="text-emerald-100/80 text-sm mb-2 font-semibold">Métricas de Temperatura</h4>
                                <p className="text-white text-base leading-relaxed font-medium">{activeSignal.aiAnalysis.emotion}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mb-20">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Borrador de Contacto
                            </h3>
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                              <textarea
                                className="w-full h-48 p-6 text-slate-700 leading-relaxed resize-none focus:outline-none bg-transparent"
                                value={activeSignal.draftMessage}
                                readOnly
                              />
                              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                                <button onClick={handleRegenerate} disabled={isRegenerating} className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-slate-200/50 cursor-pointer disabled:opacity-50">
                                  {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                  {isRegenerating ? 'Regenerando...' : 'Regenerar Ángulo'}
                                </button>
                                <button onClick={handleArchive} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl shadow-[0_4px_14px_0_rgb(16,185,129,39%)] hover:shadow-[0_6px_20px_rgba(16,185,129,23%)] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer">
                                  <Send className="w-4 h-4" /> Aprobar y Enviar a CRM
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Pipeline List */}
                    {(() => {
                      const radarSignals = signals.filter(s => s.source === selectedRadarTab);
                      if (radarSignals.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                            <Radar className="w-12 h-12 mb-4 opacity-30" />
                            <p>No hay candidatos en este pipeline.</p>
                          </div>
                        );
                      }

                      // Group by relative date (mocked logic based on createdAt vs now)
                      // For visualization, we'll just divide existing signals artificially into 'Hoy', 'Ayer'
                      const groups = [
                        { name: 'Hoy', count: Math.ceil(radarSignals.length / 2), signals: radarSignals.slice(0, Math.ceil(radarSignals.length / 2)) },
                        { name: 'Ayer', count: radarSignals.length - Math.ceil(radarSignals.length / 2), signals: radarSignals.slice(Math.ceil(radarSignals.length / 2)) }
                      ].filter(g => g.signals.length > 0);

                      return (
                        <div className="pb-20 bg-white">
                          {groups.map((group, gIdx) => (
                            <div key={gIdx} className="mb-4">
                              {/* Group Header */}
                              <div className="flex items-center gap-4 px-8 py-4 sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-200">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  {group.name}
                                </div>
                                <div className="h-px bg-slate-200 flex-1 relative top-px"></div>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{group.count} leads</span>
                              </div>

                              {/* Group Items */}
                              <div className="divide-y divide-slate-100 border-b border-slate-200">
                                {group.signals.map(signal => {
                                  const initials = signal.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                  const mockScore = signal.temperature === 'Alto' ? 85 : signal.temperature === 'Medio' ? 70 : 45;

                                  return (
                                    <div key={signal.id} className="grid grid-cols-[2.5fr_2fr_1fr_3.5fr_1fr_0.5fr] gap-4 px-8 py-4 items-center hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveSignalId(signal.id)}>
                                      {/* Candidato */}
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm">
                                          {initials}
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-slate-900">{signal.name}</h4>
                                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {signal.location}</p>
                                        </div>
                                      </div>
                                      {/* Rol */}
                                      <div>
                                        <p className="text-sm text-slate-700 font-medium truncate">{signal.roleCompany.split(',')[0]}</p>
                                        <a href={signal.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-1 hover:underline">
                                          <Globe className="w-3 h-3" /> Ver Perfil
                                        </a>
                                      </div>
                                      {/* Estado */}
                                      <div>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                          En Reserva
                                        </span>
                                      </div>
                                      {/* Mensaje */}
                                      <div className="pr-4">
                                        <p className="text-sm text-slate-600 line-clamp-1 group-hover:text-slate-900 transition-colors">{signal.draftMessage}</p>
                                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(signal.draftMessage); showToast('Copiado', 'success') }} className="text-xs text-slate-400 hover:text-emerald-600 font-medium mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Save className="w-3 h-3" /> Copiar Mensaje
                                        </button>
                                      </div>
                                      {/* Score */}
                                      <div className="flex items-center gap-3">
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                          <div className={`h-full ${mockScore > 80 ? 'bg-emerald-500' : mockScore > 60 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${mockScore}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{mockScore}%</span>
                                      </div>
                                      {/* Acciones */}
                                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setActiveSignalId(signal.id) }} className="text-slate-600 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer bg-white hover:bg-slate-900 border border-slate-200 hover:border-slate-900 px-3 py-1.5 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                                          Ver Detalle
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </main>
              } />

              {/* ==================== ARCHIVE ==================== */}
              <Route path="/archive" element={
                <main className="flex-1 bg-white overflow-y-auto relative p-10">
                  <div className="max-w-5xl mx-auto">
                    <header className="mb-10">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Archivo</h1>
                      <p className="text-slate-500">Leads procesados y enviados a CRM.</p>
                    </header>

                    {archivedSignals.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">
                        <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No hay leads archivados</p>
                        <p className="text-sm mt-2">Los leads que apruebes y envíes a CRM aparecerán aquí.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {archivedSignals.map(signal => (
                          <div key={signal.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${RADAR_CONFIG[signal.source].color}`}>
                                    {RADAR_CONFIG[signal.source].icon}
                                    {signal.trigger}
                                  </span>
                                  <span className="text-xs text-slate-400">Archivado el {signal.archivedAt ? new Date(signal.archivedAt).toLocaleDateString('es-ES') : '-'}</span>
                                </div>
                                <h3 className="font-semibold text-slate-900 text-lg">{signal.name}</h3>
                                <p className="text-sm text-slate-500">{signal.roleCompany} · {signal.location}</p>
                              </div>
                              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                <CheckCircle className="w-3 h-3" /> Procesado
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </main>
              } />

              {/* ==================== SETTINGS ==================== */}
              <Route path="/settings" element={
                <main className="flex-1 bg-white overflow-y-auto relative p-10">
                  <div className="max-w-3xl mx-auto">
                    <header className="mb-10">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Configuración de Radares</h1>
                      <p className="text-slate-500">Configura las fuentes de datos y keywords de cada radar.</p>
                    </header>

                    {settings ? (
                      <div className="space-y-8">
                        {(Object.keys(RADAR_CONFIG) as RadarSource[]).map(radar => (
                          <div key={radar} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <span className={`flex items-center gap-2 text-sm font-semibold ${RADAR_CONFIG[radar].color} px-3 py-1.5 rounded-lg`}>
                                  {RADAR_CONFIG[radar].icon}
                                  {RADAR_CONFIG[radar].label}
                                </span>
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-sm text-slate-500">{settings[radar].enabled ? 'Activo' : 'Desactivado'}</span>
                                <button
                                  onClick={() => setSettings({ ...settings, [radar]: { ...settings[radar], enabled: !settings[radar].enabled } })}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${settings[radar].enabled ? 'bg-slate-900' : 'bg-slate-200'}`}
                                >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[radar].enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                              </label>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 block mb-2">Keywords de búsqueda</label>
                              <textarea
                                value={settings[radar].keywords.join('\n')}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  [radar]: { ...settings[radar], keywords: e.target.value.split('\n').filter(k => k.trim()) }
                                })}
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                                placeholder="Una keyword por línea..."
                              />
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end gap-3">
                          <button
                            onClick={loadSettings}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Descartar cambios
                          </button>
                          <button
                            onClick={handleSaveSettings}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                            Guardar configuración
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                      </div>
                    )}
                  </div>
                </main>
              } />

              {/* ==================== PROFILE ==================== */}
              <Route path="/profile" element={
                <main className="flex-1 bg-white overflow-y-auto relative p-10">
                  <div className="max-w-3xl mx-auto">
                    <header className="mb-10">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Mi Perfil</h1>
                      <p className="text-slate-500">Configuración de usuario y preferencias.</p>
                    </header>

                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <User className="w-10 h-10 text-slate-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">Antonio</h2>
                          <p className="text-slate-500">Consultor de Mediación y M&A</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-2">Nombre</label>
                          <input type="text" defaultValue="Antonio" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-2">Email</label>
                          <input type="email" defaultValue="antonio@vantageleads.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-2">Sector de Especialización</label>
                          <input type="text" defaultValue="Mediación, Compra-venta de Empresas, Gestión de Patrimonios" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-2">OpenAI API Key</label>
                          <input type="password" placeholder="sk-proj-..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                          <p className="text-xs text-slate-400 mt-1">Se configura como variable de entorno en Vercel (OPENAI_API_KEY)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              } />
            </Routes>
          </div>
        </ProtectedRoute >
      } />
    </Routes >
  );
}
