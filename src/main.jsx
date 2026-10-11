import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertCircle, ArrowRight, Bot, CheckCircle2, ChevronRight, CircleDollarSign,
  FileCode2, FolderOpen, Gauge, KeyRound, LayoutDashboard, LogIn, LogOut, Menu,
  MoreHorizontal, Package, Plus, Rocket, Server, Settings, ShieldCheck, Terminal,
  UserPlus, Wallet, X, Zap, LoaderCircle
} from 'lucide-react';
import './styles.css';
import OverviewPage from './pages/Overview.jsx';
import AvailableBots, { BotLogsPage } from './pages/AvailableBots.jsx';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const REMEMBERED_EMAIL = 'rememberedEmail';
const TOPUP_KES = 70;

const api = async (path, options = {}) => {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const response = await fetch(`${API}${path}`, { ...options, headers, credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || data.error || 'Something went wrong.'); error.status = response.status; error.data = data; throw error; }
  return data;
};

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function Notice({ error = false, children }) {
  return <div className={`notice ${error ? 'error' : ''}`}>{error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}<span>{children}</span></div>;
}

function Brand() {
  return <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}><span className="brand-mark">FT</span><span>Fluxytech</span></a>;
}

const menu = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/bots', label: 'Available Bots', icon: Bot },
  { path: '/files', label: 'My Files', icon: FolderOpen },
  { path: '/deployments', label: 'Deployments', icon: Rocket },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: Settings },
];

function Sidebar({ path, user, onLogout, open, onClose }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="sidebar-top"><Brand /><button className="mobile-close" onClick={onClose}><X size={18} /></button></div>
    <div className="workspace-switch"><span className="workspace-dot" /><span><b>{user.isDemo ? 'Demo workspace' : 'Personal workspace'}</b><small>{user.isDemo ? 'Testing only' : 'Production'}</small></span><ChevronRight size={15} /></div>
    <nav className="nav-list">{menu.map(({ path: itemPath, label, icon: Icon }) => <a key={itemPath} className={path === itemPath ? 'active' : ''} href={itemPath} onClick={(event) => { event.preventDefault(); navigate(itemPath); onClose(); }}><Icon size={17} /><span>{label}</span>{itemPath === '/wallet' && user.wallet_balance > 0 && <em>KES {user.wallet_balance}</em>}</a>)}</nav>
    <div className="sidebar-bottom"><div className="secure-chip"><ShieldCheck size={15} /><span><b>{user.isDemo ? 'Demo access active' : 'Workspace secured'}</b><small>{user.isDemo ? 'Real payments disabled' : 'JWT session active'}</small></span></div><button className="logout-link" onClick={onLogout}><LogOut size={16} /> Sign out</button></div>
  </aside>;
}

function AppShell({ children, path, user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="app-shell"><Sidebar path={path} user={user} onLogout={onLogout} open={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="topbar-title">{menu.find((item) => item.path === path)?.label || 'Workspace'}</div><div className="topbar-right"><a className="top-balance" href="/wallet" onClick={(event) => { event.preventDefault(); navigate('/wallet'); }}><Wallet size={15} /> KES {user.wallet_balance}</a><div className="avatar">{user.email.slice(0, 1).toUpperCase()}</div></div></header><main className="content">{children}</main></div></div>;
}

function AuthHeader() { return <header className="public-header"><Brand /><a className="outline-btn" href="/login" onClick={(event) => { event.preventDefault(); navigate('/login'); }}>Sign in</a></header>; }

function AuthCard({ mode, onUser }) {
  const login = mode === 'login';
  const [email, setEmail] = useState(localStorage.getItem(REMEMBERED_EMAIL) || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); setBusy(true); setMessage(''); try { const data = await api(login ? '/api/auth/login' : '/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem(REMEMBERED_EMAIL, email.trim().toLowerCase()); onUser(data.user); navigate('/'); } catch (error) { setMessage(error.message); } finally { setBusy(false); } }
  return <><AuthHeader /><main className="auth-wrap"><div className="auth-card"><div className="eyebrow">{login ? <LogIn size={15} /> : <UserPlus size={15} />} ACCOUNT ACCESS</div><h1>{login ? 'Welcome back' : 'Create your Fluxytech account'}</h1><p className="muted">{login ? 'Manage bots, funding, and deployments from one secure workspace.' : 'Start with a secure wallet and deploy your WhatsApp bot in minutes.'}</p>{message && <Notice error>{message}</Notice>}<form onSubmit={submit}><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={login ? 'current-password' : 'new-password'} minLength="8" required placeholder="At least 8 characters" /></label><button className="primary wide" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : login ? <LogIn size={17} /> : <UserPlus size={17} />}{login ? 'Sign in' : 'Create account'}</button></form>{login && <a className="small-link" href="/forgot-password" onClick={(event) => { event.preventDefault(); navigate('/forgot-password'); }}>Forgot password?</a>}<p className="switch">{login ? 'New to Fluxytech?' : 'Already have an account?'} <a href={login ? '/signup' : '/login'} onClick={(event) => { event.preventDefault(); navigate(login ? '/signup' : '/login'); }}>{login ? 'Create an account' : 'Sign in'}</a></p></div></main></>;
}

function Forgot() {
  const [email, setEmail] = useState(localStorage.getItem(REMEMBERED_EMAIL) || ''); const [code, setCode] = useState(''); const [newPassword, setNewPassword] = useState(''); const [sent, setSent] = useState(false); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function request(event) { event.preventDefault(); setBusy(true); try { await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setSent(true); setMessage('If an account exists, a six-digit code has been sent.'); } catch (error) { setMessage(error.message); } finally { setBusy(false); } }
  async function reset(event) { event.preventDefault(); setBusy(true); try { await api('/api/auth/verify-reset-code', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }); setMessage('Password updated. You can sign in now.'); setSent(false); } catch (error) { setMessage(error.message); } finally { setBusy(false); } }
  return <><AuthHeader /><main className="auth-wrap"><div className="auth-card"><div className="eyebrow"><KeyRound size={15} /> ACCOUNT RECOVERY</div><h1>Reset your password</h1><p className="muted">We’ll email a six-digit code that expires in 15 minutes.</p>{message && <Notice>{message}</Notice>}<form onSubmit={sent ? reset : request}><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>{sent && <><label>Six-digit code<input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required /></label><label>New password<input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" minLength="8" required /></label></>}<button className="primary wide" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <KeyRound size={17} />}{sent ? 'Update password' : 'Send reset code'}</button></form><a className="small-link" href="/login" onClick={(event) => { event.preventDefault(); navigate('/login'); }}>Back to sign in</a></div></main></>;
}

function PageHeading({ eyebrow, title, subtitle, action }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</div>; }

function StatCard({ icon: Icon, label, value, note, green = false }) { return <div className="stat-card"><div className={`stat-icon ${green ? 'green' : ''}`}><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }

function LegacyOverview({ user, setUser }) {
  const [message, setMessage] = useState('');
  const [deploying, setDeploying] = useState(false);
  async function deploy() { setDeploying(true); setMessage(''); try { const result = await api('/api/deploy', { method: 'POST', body: JSON.stringify({ bot: 'silentwolf' }) }); setUser((current) => ({ ...current, wallet_balance: result.wallet_balance })); setMessage('Bot deployment accepted. KES 70 was deducted from your wallet.'); } catch (error) { setMessage(error.message); } finally { setDeploying(false); } }
  return <><PageHeading eyebrow="CONTROL PLANE / OVERVIEW" title="Good to see you." subtitle="Your nodeX workspace for bots, files, deployments, and funding." action={<button className="primary" onClick={deploy} disabled={deploying || user.wallet_balance < TOPUP_KES}>{deploying ? <LoaderCircle className="spin" size={17} /> : <Rocket size={17} />}{user.wallet_balance < TOPUP_KES ? 'Fund to deploy' : 'Deploy bot'}</button>} />{message && <Notice error={message.toLowerCase().includes('insufficient')}>{message}</Notice>}<div className="stats-grid"><StatCard icon={Bot} label="Active bots" value="0" note="Ready to deploy" green /><StatCard icon={CircleDollarSign} label="Wallet balance" value={`KES ${user.wallet_balance}`} note="Internal, non-withdrawable" /><StatCard icon={Activity} label="Uptime" value="99.9%" note="Workspace health" green /><StatCard icon={Server} label="Plan" value="Starter" note="1 workspace" /></div><div className="dashboard-grid"><section className="panel activity-panel"><div className="panel-head"><div><span className="section-kicker">WORKSPACE ACTIVITY</span><h2>Recent activity</h2></div><a className="text-link" href="/deployments" onClick={(event) => { event.preventDefault(); navigate('/deployments'); }}>View all <ArrowRight size={14} /></a></div><div className="empty-state"><div className="empty-icon"><Activity size={23} /></div><h3>No activity yet</h3><p className="muted">Top up your wallet and deploy your first bot to see activity here.</p><a className="secondary-btn" href="/wallet" onClick={(event) => { event.preventDefault(); navigate('/wallet'); }}>Open wallet</a></div></section><section className="panel quick-panel"><div className="panel-head"><div><span className="section-kicker">QUICK START</span><h2>Build something</h2></div><Zap size={18} className="green-text" /></div><div className="quick-list"><a href="/files" onClick={(event) => { event.preventDefault(); navigate('/files'); }}><FileCode2 size={18} /><span><b>Upload bot files</b><small>Add your source files to the workspace</small></span><ChevronRight size={16} /></a><a href="/wallet" onClick={(event) => { event.preventDefault(); navigate('/wallet'); }}><Wallet size={18} /><span><b>Fund your wallet</b><small>Pay KES 70 with Paystack Inline</small></span><ChevronRight size={16} /></a><a href="/settings" onClick={(event) => { event.preventDefault(); navigate('/settings'); }}><Settings size={18} /><span><b>Review settings</b><small>Manage your account preferences</small></span><ChevronRight size={16} /></a></div></section></div></>;
}

function FilesPage() {
  const [files, setFiles] = useState([]); const [selected, setSelected] = useState(null); const [filename, setFilename] = useState(''); const [content, setContent] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function load() { try { const result = await api('/api/files'); setFiles(result.files); if (!selected && result.files[0]) openFile(result.files[0]); } catch (error) { setMessage(error.message); } }
  useEffect(() => { load(); }, []);
  function openFile(file) { setSelected(file); setFilename(file.filename); setContent(file.content); }
  function chooseUpload() { const input = document.createElement('input'); input.type = 'file'; input.onchange = () => { const file = input.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { setBusy(true); try { const result = await api('/api/files/upload', { method: 'POST', body: JSON.stringify({ filename: file.name, content: String(reader.result || '') }) }); setFiles((current) => [result.file, ...current]); openFile(result.file); setMessage('File uploaded.'); } catch (error) { setMessage(error.message); } finally { setBusy(false); } }; reader.readAsText(file); }; input.click(); }
  async function save() { if (!selected) return; setBusy(true); try { const result = await api(`/api/files/${selected.id}`, { method: 'PUT', body: JSON.stringify({ filename, content }) }); setFiles((current) => current.map((file) => file.id === result.file.id ? result.file : file)); setSelected(result.file); setMessage('File saved.'); } catch (error) { setMessage(error.message); } finally { setBusy(false); } }
  async function remove(file) { if (!window.confirm(`Delete ${file.filename}?`)) return; try { await api(`/api/files/${file.id}`, { method: 'DELETE' }); const next = files.filter((item) => item.id !== file.id); setFiles(next); if (selected?.id === file.id) { setSelected(next[0] || null); setFilename(next[0]?.filename || ''); setContent(next[0]?.content || ''); } setMessage('File deleted.'); } catch (error) { setMessage(error.message); } }
  function download() { if (!selected) return; const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename || 'nodeX-file.txt'; link.click(); URL.revokeObjectURL(url); }
  return <><PageHeading eyebrow="WORKSPACE / FILES" title="My files" subtitle="Upload, edit, download, and manage the source files used by your Heroku deployment." action={<button className="primary" onClick={chooseUpload} disabled={busy}><Plus size={17} /> Upload file</button>} />{message && <Notice>{message}</Notice>}<section className="panel file-panel"><div className="file-toolbar"><div className="path-chip"><FolderOpen size={15} /> /workspace <span className="file-count">{files.length} file{files.length === 1 ? '' : 's'}</span></div><button className="icon-btn" onClick={load}><MoreHorizontal size={17} /></button></div><div className="file-workspace"><div className="file-list">{files.length === 0 ? <div className="empty-state file-empty"><div className="empty-icon"><FolderOpen size={23} /></div><h3>Your workspace is empty</h3><p className="muted">Upload package.json and your bot entrypoint before deploying.</p><button className="secondary-btn" onClick={chooseUpload}><Plus size={15} /> Add your first file</button></div> : files.map((file) => <button className={`file-row ${selected?.id === file.id ? 'selected' : ''}`} key={file.id} onClick={() => openFile(file)}><FileCode2 size={17} /><span><b>{file.filename}</b><small>{Math.ceil(file.size / 1024)} KB · {new Date(file.updatedAt).toLocaleDateString()}</small></span><ChevronRight size={15} /></button>)}</div><div className="file-editor">{selected ? <><div className="editor-head"><input value={filename} onChange={(event) => setFilename(event.target.value)} /><div className="editor-actions"><button className="icon-btn" title="Download" onClick={download}><ArrowRight size={15} className="download-icon" /></button><button className="icon-btn danger-btn" title="Delete" onClick={() => remove(selected)}><X size={15} /></button><button className="primary" onClick={save} disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <CheckCircle2 size={15} />} Save</button></div></div><textarea className="code-editor" value={content} onChange={(event) => setContent(event.target.value)} spellCheck="false" /></> : <div className="empty-state compact"><div className="empty-icon"><FileCode2 size={22} /></div><h3>Select a file</h3><p className="muted">Choose a file from your workspace to edit it.</p></div>}</div></div></section></>;
}

function DeploymentsPage() {
  const [deployments, setDeployments] = useState([]); const [message, setMessage] = useState('');
  useEffect(() => { api('/api/deployments').then((result) => setDeployments(result.deployments || [])).catch((error) => setMessage(error.message)); }, []);
  return <><PageHeading eyebrow="WORKSPACE / RELEASES" title="Deployments" subtitle="Track Heroku releases, app URLs, logs, and runtime status from one place." action={<button className="primary" onClick={() => navigate('/')}><Rocket size={17} /> New deployment</button>} />{message && <Notice error>{message}</Notice>}<div className="release-banner"><div className="release-icon"><Rocket size={20} /></div><div><b>Heroku deployment pipeline</b><span>Create app → set config vars → push files → scale web=1.</span></div><ChevronRight size={18} /></div><section className="panel"><div className="panel-head"><div><span className="section-kicker">RELEASE HISTORY</span><h2>All deployments</h2></div></div>{deployments.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><Rocket size={22} /></div><h3>No deployments yet</h3><p className="muted">Upload package.json and your bot files, then deploy from Overview.</p></div> : <div className="deployment-list">{deployments.map((deployment) => <div className="deployment-row" key={deployment._id}><div className={`deployment-status ${deployment.status}`}><Rocket size={16} /></div><div className="deployment-main"><b>{deployment.appName || 'Fluxytech deployment'}</b><small>{deployment.team} · {deployment.stack} · {new Date(deployment.createdAt).toLocaleString()}</small>{deployment.appUrl && <a href={deployment.appUrl} target="_blank" rel="noreferrer">Open app <ArrowRight size={13} /></a>}</div><span className={`status-pill ${deployment.status}`}>{deployment.status}</span></div>)}</div>}</section></>;
}

function WalletPage({ user, setUser }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { const params = new URLSearchParams(window.location.search); const reference = params.get('reference'); if (!reference) return; setBusy(true); setMessage('Verifying your Paystack payment…'); api('/api/wallet/paystack/verify', { method: 'POST', body: JSON.stringify({ reference }) }).then((result) => { setUser((current) => ({ ...current, wallet_balance: result.wallet_balance })); setMessage('Payment verified. KES 70 was added to your internal wallet.'); }).catch((error) => setMessage(error.message)).finally(() => { setBusy(false); window.history.replaceState({}, '', '/wallet'); }); }, []);
  async function topup() { setBusy(true); setMessage('Redirecting to secure Paystack checkout…'); try { const init = await api('/api/wallet/paystack/initialize', { method: 'POST' }); if (!init.status || !init.data?.authorization_url) throw new Error(init.message || 'Paystack checkout could not be initialized.'); window.location.assign(init.data.authorization_url); } catch (error) { setMessage(error.message); setBusy(false); } }
  return <><PageHeading eyebrow="BILLING / WALLET" title="Your wallet" subtitle="Fund deployments securely. Your internal balance cannot be withdrawn." /><div className="wallet-layout"><section className="wallet-hero"><div className="wallet-hero-top"><span className="section-kicker">AVAILABLE BALANCE</span><CircleDollarSign size={21} /></div><strong>KES {user.wallet_balance}</strong><span className="wallet-sub">KES 70 per deployment</span><div className="wallet-rule" /><button className="primary" onClick={topup} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Wallet size={17} />}Add KES 70 with Paystack</button></section><section className="panel payment-panel"><div className="panel-head"><div><span className="section-kicker">HOW IT WORKS</span><h2>Simple, secure funding</h2></div><ShieldCheck size={19} className="green-text" /></div><div className="steps"><div><b>01</b><span><strong>Pay securely with Paystack</strong><small>You will return to Fluxytech after checkout.</small></span></div><div><b>02</b><span><strong>We verify your payment</strong><small>The backend checks the transaction securely.</small></span></div><div><b>03</b><span><strong>Deploy your bot</strong><small>KES 70 is deducted only when deployment starts.</small></span></div></div></section></div>{message && <Notice error={message.toLowerCase().includes('failed')}>{message}</Notice>}</>;
}

function SettingsPage({ user }) { return <><PageHeading eyebrow="WORKSPACE / SETTINGS" title="Settings" subtitle="Review your Fluxytech account and workspace configuration." /><div className="settings-grid"><section className="panel"><div className="panel-head"><div><span className="section-kicker">ACCOUNT</span><h2>Profile</h2></div><UserPlus size={18} className="green-text" /></div><div className="settings-row"><span>Email address</span><b>{user.email}</b></div><div className="settings-row"><span>Session</span><b className="status-text"><span className="status-dot" /> Secure</b></div><div className="settings-row"><span>Wallet policy</span><b>Non-withdrawable</b></div></section><section className="panel"><div className="panel-head"><div><span className="section-kicker">PLATFORM</span><h2>Runtime details</h2></div><Terminal size={18} className="green-text" /></div><div className="settings-row"><span>Environment</span><b>Production</b></div><div className="settings-row"><span>Payment provider</span><b>Paystack Redirect</b></div><div className="settings-row"><span>Deploy target</span><b>Heroku Teams</b></div></section></div></>; }

function PublicLanding() {
  return <main className="auth-wrap"><div className="auth-card"><div className="eyebrow">FLUXYTECH HOSTING</div><h1>Build. Deploy. Run.</h1><p className="muted">Fluxytech is ready for secure WhatsApp bot hosting, Paystack funding, file management, and Heroku deployments.</p><div className="notice"><ShieldCheck size={16} /><span>Protected workspace APIs remain available to authenticated sessions.</span></div></div></main>;
}
function App() {
  const [path, setPath] = useState(window.location.pathname); const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { const handler = () => setPath(window.location.pathname); window.addEventListener('popstate', handler); api('/api/auth/me').then(setUser).catch(() => api('/api/auth/demo', { method: 'POST' }).then((result) => setUser(result.user)).catch(() => {})).finally(() => setLoading(false)); return () => window.removeEventListener('popstate', handler); }, []);
  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); navigate('/login'); };
  if (loading) return <div className="loading-screen"><span className="brand-mark">nX</span><LoaderCircle className="spin" size={18} /></div>;
  if (!user) return <PublicLanding />;
  let page = <OverviewPage user={user} api={api} navigate={navigate} />; if (path === '/bots') page = <AvailableBots api={api} navigate={navigate} />; if (path.startsWith('/bots/') && path.endsWith('/logs')) page = <BotLogsPage slug={path.split('/')[2]} api={api} navigate={navigate} />; if (path === '/files') page = <FilesPage />; if (path === '/deployments') page = <DeploymentsPage />; if (path === '/wallet') page = <WalletPage user={user} setUser={setUser} />; if (path === '/settings') page = <SettingsPage user={user} />;
  return <AppShell path={path} user={user} onLogout={logout}>{page}</AppShell>;
}

createRoot(document.getElementById('root')).render(<App />);
