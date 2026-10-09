import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Search, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/better-materials-logo.png.asset.json';
import { navigation, originalUrl } from '@/lib/reworld-data';

export function ReworldHeader({ industryPage = false }: { industryPage?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [mobile, setMobile] = useState(false);
  const active = navigation.find(n => n.name === open);
  const destination = (path: string) => industryPage && path.startsWith('#') ? `/${path}` : originalUrl(path);
  const menuLink = (path: string, name: string, close: () => void) => industryPage && path.startsWith('#industry-')
    ? <Link key={path} to="/who-we-help/$industry" params={{ industry: path.replace('#industry-', '') }} onClick={close}>{name}</Link>
    : <a key={path} href={destination(path)} onClick={close}>{name}</a>;
  return <header className="site-header" onMouseLeave={() => setOpen(null)}>
    <div className="site-container main-navigation">
      <a href="/" aria-label="Better Materials home"><img className="brand-logo" src={logo.url} alt="Better Materials" /></a>
      <nav aria-label="Main navigation" className={mobile ? 'main-nav is-mobile-open' : 'main-nav'}>
        {navigation.map(item => item.links.length ? <Button key={item.name} variant="navigation" aria-expanded={open === item.name} onMouseEnter={() => setOpen(item.name)} onClick={() => setOpen(open === item.name ? null : item.name)}>{item.name}</Button> : <a key={item.name} href={destination(item.path)} onMouseEnter={() => setOpen(null)}>{item.name}</a>)}
        <Button variant="brand" asChild><a href={destination('#platform')}>Explore the Platform</a></Button>
      </nav>
      <Button variant="navigation" className="mobile-toggle" aria-label={mobile ? 'Close menu' : 'Open menu'} onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</Button>
    </div>
    {active && active.links.length > 0 && <div className="mega-menu"><div className="site-container mega-inner"><div><h3>{active.heading}</h3><div className="mega-links">{active.links.map(l => menuLink(l.path, l.name, () => {setOpen(null); setMobile(false);}))}</div><a className="text-link" href={destination(active.path)}>View All {active.name === 'What We Do' ? 'Solutions' : active.name === 'Who We Serve' ? 'Industries' : active.name}</a></div><aside><h3>Not sure where to start?</h3><p>Explore your feedstocks, equipment, performance, and goals. Better Materials helps identify promising pathways for material development.</p><Button variant="brand" asChild><a href={destination('#platform')}>Explore Material Intelligence</a></Button></aside></div></div>}
    {search && <div className="search-panel site-container"><form onSubmit={event => event.preventDefault()}><Search/><input value={query} onChange={event => setQuery(event.target.value)} aria-label="Search Better Materials" placeholder="Search Better Materials" autoFocus/><Button variant="navigation" type="button" aria-label="Close search" onClick={() => setSearch(false)}><X/></Button></form>{query && <div className="mega-links">{navigation.flatMap(n => n.links).filter(l => l.name.toLowerCase().includes(query.toLowerCase())).map(l => menuLink(l.path, l.name, () => {setSearch(false); setOpen(null);}))}</div>}</div>}
  </header>;
}