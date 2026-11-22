import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../icons/IconCollection';

const Footer: React.FC = () => {
  const footerLinks = {
    'Product': ['Events', 'Dashboard', 'Features', 'Pricing'],
    'Company': ['About Us', 'Careers', 'Contact'],
    'Legal': ['Privacy Policy', 'Terms of Service'],
  };

  return (
    <footer className="bg-surface dark:bg-surface-dark border-t border-border-color dark:border-border-color-dark">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-text-secondary dark:text-text-secondary-dark">The Heartbeat of Your Campus.</p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold font-display text-text-primary dark:text-text-primary-dark">{title}</h4>
              <ul className="mt-4 space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <Link to="#" className="text-sm text-text-secondary dark:text-text-secondary-dark hover:text-accent transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border-color dark:border-border-color-dark text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          &copy; {new Date().getFullYear()} Eventila. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;