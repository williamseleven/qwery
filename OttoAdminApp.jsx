/* Otto Admin — self-contained app entry for the DC template.
   Merges the shell + 3 screens into one module rendered by the DC runtime's
   React (no second React/ReactDOM/Babel). DS primitives are read from the
   global namespace at render time so load order with _ds_bundle.js never races. */

const NS = 'OttoDesignSystem_feafa9';

const NAV = [
  { key: 'home', icon: 'House', label: 'Início' },
  { key: 'orders', icon: 'ShoppingCart', label: 'Pedidos' },
  { key: 'catalog', icon: 'Package', label: 'Catálogo' },
  { key: 'categories', icon: 'FolderOpen', label: 'Categorias' },
  { key: 'customers', icon: 'Users', label: 'Clientes' },
  { key: 'marketing', icon: 'Megaphone', label: 'Marketing' },
  { key: 'analytics', icon: 'ChartBar', label: 'Relatórios' },
];
const NAV_BOTTOM = [
  { key: 'settings', icon: 'Gear', label: 'Configurações' },
  { key: 'support', icon: 'ChatCircleDots', label: 'Suporte' },
];

function Rail({ current, onNav }) {
  const { Icon, Tooltip } = window[NS];
  const item = (n) => {
    const on = n.key === current;
    return (
      <Tooltip key={n.key} title={n.label} placement="right">
        <button onClick={() => onNav(n.key)} style={{
          width: 40, height: 40, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)',
          background: on ? '#fff' : 'transparent',
          color: on ? 'var(--brand-master)' : 'rgba(255,255,255,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s',
        }}
        onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; } }}
        onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; } }}>
          <Icon name={n.icon} weight={on ? 'fill' : 'regular'} size={20} />
        </button>
      </Tooltip>
    );
  };
  return (
    <div style={{ width: 60, flexShrink: 0, background: 'var(--brand-master)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4 }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 2px 8px rgba(110,97,229,0.5)' }}>
        <span style={{ width: 16, height: 16, borderRadius: '50%', border: '4px solid #fff' }} />
      </div>
      {NAV.map(item)}
      <div style={{ flex: 1 }} />
      {NAV_BOTTOM.map(item)}
    </div>
  );
}

function Topbar({ store, onStore }) {
  const { Badge, Avatar, Select } = window[NS];
  return (
    <div style={{ height: 56, flexShrink: 0, background: 'var(--surface-card)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px' }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--brand-master)' }}>Admin</span>
      <span style={{ width: 1, height: 24, background: 'var(--border-base)' }} />
      <Select value={store} onChange={onStore} options={[
        { value: 'b2b', label: 'Infralab / Infralab B2B (padrão)' },
        { value: 'b2c', label: 'Infralab / Loja B2C' },
        { value: 'mkt', label: 'Infralab / Marketplace' },
      ]} style={{ minWidth: 280 }} />
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 20, lineHeight: 1 }} title="Brasil (pt-BR)">🇧🇷</span>
      <i className="ph ph-question" style={{ fontSize: 20, color: 'var(--text-tertiary)', cursor: 'pointer' }} />
      <Badge dot color="var(--status-error)"><i className="ph ph-bell" style={{ fontSize: 20, color: 'var(--text-tertiary)', cursor: 'pointer' }} /></Badge>
      <span style={{ boxShadow: '0 0 0 2px var(--status-error)', borderRadius: '50%', display: 'inline-flex' }}>
        <Avatar size="default" color="var(--brand-master)">RM</Avatar>
      </span>
    </div>
  );
}

function PageHeader({ title, description, breadcrumb, actions, children }) {
  const { Breadcrumb } = window[NS];
  return (
    <div style={{ marginBottom: 20 }}>
      {breadcrumb && <div style={{ marginBottom: 10 }}><Breadcrumb items={breadcrumb} /></div>}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--type-heading-lg)', color: 'var(--text-heading)', lineHeight: 1.2 }}>{title}</h1>
          {description && <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--type-body-md)', color: 'var(--text-tertiary)' }}>{description}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function AppShell({ current, onNav, store, onStore, children }) {
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--surface-page)', fontFamily: 'var(--font-ui)' }}>
      <Rail current={current} onNav={onNav} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar store={store} onStore={onStore} />
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>{children}</div>
      </div>
    </div>
  );
}

/* ---- Dashboard ---- */
function Stat({ label, value, delta, up, icon, accent }) {
  const { Tag, Icon } = window[NS];
  return (
    <div style={{ flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{label}</span>
        <span style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: accent + '1f', color: accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} weight="fill" size={18} />
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 28, color: 'var(--text-heading)', marginTop: 10 }}>{value}</div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Tag color={up ? 'pay' : 'error'}><Icon name={up ? 'TrendUp' : 'TrendDown'} size={12} weight="bold" /> {delta}</Tag>
        <span style={{ fontSize: 12, color: 'var(--text-quaternary)' }}>vs. mês anterior</span>
      </div>
    </div>
  );
}

function DashboardScreen() {
  const { Card, Tag, Timeline, Progress, Table, Button, Icon } = window[NS];
  const channels = [
    { name: 'B2B Portal', pct: 64, color: 'var(--brand-shop)' },
    { name: 'Marketplace', pct: 23, color: 'var(--brand-data)' },
    { name: 'Loja B2C', pct: 13, color: 'var(--brand-log)' },
  ];
  const orderCols = [
    { key: 'id', title: 'Pedido', dataIndex: 'id', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{v}</span> },
    { key: 'cust', title: 'Cliente', dataIndex: 'cust' },
    { key: 'total', title: 'Total', dataIndex: 'total', align: 'right', render: (v) => <b style={{ color: 'var(--text-primary)' }}>{v}</b> },
    { key: 's', title: 'Status', dataIndex: 's', render: (v) => <Tag color={v === 'Pago' ? 'pay' : v === 'Pendente' ? 'warning' : 'info'} solid={v === 'Pago'}>{v}</Tag> },
  ];
  const orders = [
    { key: 1, id: '#48201', cust: 'Construtora Andrade', total: 'R$ 12.480', s: 'Pago' },
    { key: 2, id: '#48200', cust: 'Mercado Vale Ltda', total: 'R$ 3.190', s: 'Pendente' },
    { key: 3, id: '#48199', cust: 'TechParts S.A.', total: 'R$ 8.755', s: 'Enviado' },
    { key: 4, id: '#48198', cust: 'Oficina Central', total: 'R$ 1.020', s: 'Pago' },
  ];
  return (
    <div>
      <PageHeader title="Bem-vindo de volta, Rafael" description="Resumo da operação — Infralab B2B · últimos 30 dias"
        actions={<Button type="secondary" icon={<Icon name="CalendarBlank" size={16} />}>Últimos 30 dias</Button>} />
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Stat label="Receita" value="R$ 1,24M" delta="12,4%" up icon="CurrencyDollarSimple" accent="#6E61E5" />
        <Stat label="Pedidos" value="3.812" delta="8,1%" up icon="ShoppingCart" accent="#32CC7E" />
        <Stat label="Ticket médio" value="R$ 326" delta="2,3%" up={false} icon="Receipt" accent="#FFAC48" />
        <Stat label="Conversão" value="3,9%" delta="0,6%" up icon="ChartLineUp" accent="#43BDDC" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16 }}>
        <Card title="Pedidos recentes" extra={<a href="#" style={{ fontSize: 13 }}>Ver todos</a>} bodyStyle={{ padding: 0 }}>
          <Table columns={orderCols} dataSource={orders} />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Vendas por canal" size="small">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {channels.map((c) => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{c.pct}%</span>
                  </div>
                  <Progress percent={c.pct} showInfo={false} strokeColor={c.color} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Atividade" size="small">
            <Timeline items={[
              { color: 'pay', children: 'Pedido #48201 pago · há 5 min' },
              { color: 'shop', children: '12 produtos importados · há 1h' },
              { color: 'data', children: 'Estoque baixo: Headphone NC · há 2h' },
              { color: 'gray', children: 'Relatório mensal gerado · ontem' },
            ]} />
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---- Produtos ---- */
const STATUS_TAG = {
  Ativo: { color: 'pay', solid: true }, Esgotado: { color: 'error' },
  Baixo: { color: 'warning' }, Inativo: { color: 'default' },
};
function StatusTag({ s }) {
  const { Tag } = window[NS];
  const cfg = STATUS_TAG[s] || STATUS_TAG.Inativo;
  return <Tag color={cfg.color} solid={cfg.solid}>{s}</Tag>;
}
function ProductsScreen() {
  const { Button, Input, Select, Table, Tag, Avatar, Pagination, Tabs, Checkbox, Dropdown, Icon } = window[NS];
  const PRODUCTS = [
    { key: 1, sku: 'NB-PRO-14', name: 'Notebook Pro 14" M3', cat: 'Eletrônicos', price: 'R$ 8.499,00', stock: 42, status: 'Ativo' },
    { key: 2, sku: 'MS-WL-021', name: 'Mouse sem fio ergonômico', cat: 'Acessórios', price: 'R$ 189,90', stock: 310, status: 'Ativo' },
    { key: 3, sku: 'KB-MEC-87', name: 'Teclado mecânico 87 teclas', cat: 'Acessórios', price: 'R$ 549,00', stock: 0, status: 'Esgotado' },
    { key: 4, sku: 'MN-27-4K', name: 'Monitor 27" 4K UHD', cat: 'Eletrônicos', price: 'R$ 2.299,00', stock: 18, status: 'Ativo' },
    { key: 5, sku: 'HP-NC-900', name: 'Headphone com cancelamento', cat: 'Áudio', price: 'R$ 1.299,00', stock: 7, status: 'Baixo' },
    { key: 6, sku: 'CB-USBC-2', name: 'Cabo USB-C 2m', cat: 'Acessórios', price: 'R$ 79,90', stock: 1240, status: 'Ativo' },
    { key: 7, sku: 'WC-HD-001', name: 'Webcam Full HD', cat: 'Eletrônicos', price: 'R$ 349,00', stock: 0, status: 'Inativo' },
  ];
  const [tab, setTab] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [sel, setSel] = React.useState([]);
  const allChecked = sel.length === PRODUCTS.length;
  const toggleAll = () => setSel(allChecked ? [] : PRODUCTS.map((p) => p.key));
  const toggle = (k) => setSel((s) => s.includes(k) ? s.filter((x) => x !== k) : [...s, k]);
  const columns = [
    { key: 'check', title: <Checkbox checked={allChecked} indeterminate={sel.length > 0 && !allChecked} onChange={toggleAll} />, width: 40,
      render: (_, r) => <Checkbox checked={sel.includes(r.key)} onChange={() => toggle(r.key)} /> },
    { key: 'name', title: 'Produto', dataIndex: 'name', render: (v, r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar shape="square" color="var(--surface-sunken)"><Icon name="Package" size={18} color="var(--text-tertiary)" /></Avatar>
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-quaternary)' }}>{r.sku}</div>
        </div>
      </div>
    ) },
    { key: 'cat', title: 'Categoria', dataIndex: 'cat', render: (v) => <Tag>{v}</Tag> },
    { key: 'price', title: 'Preço', dataIndex: 'price', align: 'right', render: (v) => <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span> },
    { key: 'stock', title: 'Estoque', dataIndex: 'stock', align: 'right', render: (v) => <span style={{ color: v === 0 ? 'var(--status-error)' : 'var(--text-primary)' }}>{v.toLocaleString('pt-BR')}</span> },
    { key: 'status', title: 'Status', dataIndex: 'status', render: (v) => <StatusTag s={v} /> },
    { key: 'actions', title: '', width: 48, align: 'center', render: (_, r) => (
      <Dropdown placement="bottomRight" trigger={<Button type="text" shape="circle" icon={<Icon name="DotsThreeVertical" weight="bold" />} />} items={[
        { key: 'edit', label: 'Editar', icon: <Icon name="PencilSimple" size={16} /> },
        { key: 'dup', label: 'Duplicar', icon: <Icon name="Copy" size={16} /> },
        { divider: true },
        { key: 'del', label: 'Excluir', icon: <Icon name="Trash" size={16} />, danger: true },
      ]} />
    ) },
  ];
  return (
    <div>
      <PageHeader
        breadcrumb={[{ title: <Icon name="House" size={15} />, href: '#' }, { title: 'Catálogo', href: '#' }, { title: 'Produtos' }]}
        title="Produtos"
        description="Gerencie o catálogo da Infralab B2B — 150.284 itens cadastrados."
        actions={<>
          <Button type="secondary" icon={<Icon name="DownloadSimple" size={16} />}>Exportar</Button>
          <Button type="primary" icon={<Icon name="Plus" weight="bold" size={16} />}>Novo produto</Button>
        </>} />
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '4px 16px 0' }}>
          <Tabs activeKey={tab} onChange={setTab} items={[
            { key: 'all', label: 'Todos' }, { key: 'active', label: 'Ativos' },
            { key: 'low', label: 'Estoque baixo' }, { key: 'out', label: 'Esgotados' },
          ]} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 280 }}><Input placeholder="Buscar por nome ou SKU…" prefix={<Icon name="MagnifyingGlass" size={16} />} /></div>
          <Select placeholder="Categoria" options={['Todas', 'Eletrônicos', 'Acessórios', 'Áudio']} />
          <Select placeholder="Status" options={['Todos', 'Ativo', 'Esgotado', 'Inativo']} />
          <div style={{ flex: 1 }} />
          {sel.length > 0 && <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{sel.length} selecionado(s)</span>}
          <Button type="secondary" icon={<Icon name="FunnelSimple" size={16} />}>Filtros</Button>
        </div>
        <Table columns={columns} dataSource={PRODUCTS} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Total de itens: 150.284</span>
          <Pagination total={150284} pageSize={10} current={page} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}

/* ---- Wizard ---- */
function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</span>
      {children}
      {hint && <span style={{ display: 'block', fontSize: 12, color: 'var(--text-quaternary)', marginTop: 5 }}>{hint}</span>}
    </label>
  );
}
function ProductWizardScreen() {
  const { Steps, Select, Input, Button, Card, Icon, Divider } = window[NS];
  const [step, setStep] = React.useState(1);
  const steps = [
    { title: 'Informações' }, { title: 'Categorização' }, { title: 'Preço & estoque' },
    { title: 'Mídias' }, { title: 'SEO' }, { title: 'Revisão' },
  ];
  return (
    <div>
      <PageHeader
        breadcrumb={[{ title: 'Catálogo', href: '#' }, { title: 'Produtos', href: '#' }, { title: 'Novo produto' }]}
        title="Novo produto"
        description="Cadastre um item no catálogo em poucos passos." />
      <Card bodyStyle={{ padding: 32 }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Steps current={step} items={steps} />
          <Divider />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 'var(--type-heading-md)', color: 'var(--text-heading)', textAlign: 'center', margin: '8px 0 6px' }}>
            Agora identifique a categoria, marca e fabricante do seu produto
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14, maxWidth: 620, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Especifique como seu produto será categorizado e identificado em nosso sistema. Essas informações são cruciais para a classificação e o reconhecimento eficaz dos seus produtos na plataforma.
          </p>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 'var(--type-heading-sm)', color: 'var(--text-heading)', marginBottom: 16 }}>Gestão de categorização</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Categoria"><Select placeholder="Selecione a categoria" options={['Eletrônicos', 'Acessórios', 'Áudio', 'Informática']} style={{ width: '100%' }} /></Field>
              <Field label="Subcategoria"><Select placeholder="Selecione a subcategoria" options={['Notebooks', 'Periféricos', 'Cabos']} style={{ width: '100%' }} /></Field>
            </div>
            <Field label="Marca"><Select placeholder="Selecione a marca" options={['Infralab', 'TechParts', 'Genérico']} style={{ width: '100%' }} /></Field>
            <Field label="Fabricante" hint="Quem produz fisicamente o item.">
              <Input placeholder="Ex.: Foxconn Brasil Ltda." />
            </Field>
          </div>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button type="text" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} icon={<Icon name="ArrowLeft" size={16} />}>Voltar</Button>
            <Button type="primary" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} iconRight={<Icon name="ArrowRight" size={16} weight="bold" />}>Próximo</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---- Orchestrator ---- */
function OttoAdminApp() {
  const [ready, setReady] = React.useState(!!window[NS]);
  const [nav, setNav] = React.useState('home');
  const [store, setStore] = React.useState('b2b');
  const [view, setView] = React.useState(null);

  React.useEffect(() => {
    if (ready) return;
    let t;
    const check = () => { if (window[NS]) setReady(true); else t = setTimeout(check, 40); };
    check();
    return () => clearTimeout(t);
  }, [ready]);

  React.useEffect(() => {
    const h = (e) => {
      const btn = e.target.closest('button');
      if (btn && btn.textContent.includes('Novo produto')) setView('wizard');
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  if (!ready) return null;
  const onNav = (k) => { setView(null); setNav(k); };
  let screen;
  if (view === 'wizard') screen = <ProductWizardScreen />;
  else if (nav === 'catalog' || nav === 'orders') screen = <ProductsScreen />;
  else screen = <DashboardScreen />;

  return (
    <AppShell current={view === 'wizard' ? 'catalog' : nav} onNav={onNav} store={store} onStore={setStore}>
      {screen}
    </AppShell>
  );
}

if (typeof module !== 'undefined' && module.exports) module.exports = { OttoAdminApp };
if (typeof window !== 'undefined') window.OttoAdminApp = OttoAdminApp;
