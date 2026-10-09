import { Link } from '@tanstack/react-router';
import { navigation } from '@/lib/reworld-data';
import footerLogo from '@/assets/better-materials-logo-white.png';

export function IndustryFooter() {
  return <footer className="site-footer"><div className="site-container">
    <div className="footer-top"><Link to="/" aria-label="Better Materials home"><img src={footerLogo} alt="Better Materials" /></Link></div>
    <div className="footer-navigation">{navigation.map(group => <div key={group.name}>
      <a className="footer-title" href={`/${group.path}`}>{group.name}</a>
      {group.links.slice(0, 5).map(link => group.name === 'Who We Serve'
        ? <Link key={link.path} to="/who-we-help/$industry" params={{ industry: link.path.replace('#industry-', '') }}>{link.name}</Link>
        : <a key={link.path} href={`/${link.path}`}>{link.name}</a>)}
    </div>)}</div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Better Materials. All rights reserved.</span><a href="/#about">Our Mission</a><a href="/#approach">Our Approach</a><a href="/#platform">Platform Overview</a></div>
  </div></footer>;
}