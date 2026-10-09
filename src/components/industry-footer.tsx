import { Link } from '@tanstack/react-router';
import { navigation } from '@/lib/reworld-data';
import footerLogo from '@/assets/better-materials-logo-white.png';
import { withBase } from '@/lib/base-path';

// Section anchors (#about) live on the homepage; page paths (/about-us) are used as-is.
const footerHref = (path: string) => withBase(path.startsWith('#') ? `/${path}` : path);

export function IndustryFooter() {
  return <footer className="site-footer"><div className="site-container">
    <div className="footer-top"><Link to="/" aria-label="Better Materials home"><img src={footerLogo} alt="Better Materials" /></Link></div>
    <div className="footer-navigation">{navigation.map(group => <div key={group.name}>
      <a className="footer-title" href={footerHref(group.path)}>{group.name}</a>
      {group.links.slice(0, 5).map(link => group.name === 'Who We Serve'
        ? <Link key={link.path} to="/who-we-help/$industry" params={{ industry: link.path.split('/').pop() ?? '' }}>{link.name}</Link>
        : <a key={link.path} href={footerHref(link.path)}>{link.name}</a>)}
    </div>)}</div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Better Materials. All rights reserved.</span><a href={withBase("/#about")}>Our Mission</a><a href={withBase("/#approach")}>Our Approach</a><a href={withBase("/#platform")}>Platform Overview</a></div>
  </div></footer>;
}