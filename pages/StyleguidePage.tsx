import React from 'react';
import PublicNavbar from '../components/layout/PublicNavbar';
import Footer from '../components/layout/Footer';

const StyleguidePage: React.FC = () => {
    return (
        <div className="bg-primary dark:bg-primary-dark">
            <PublicNavbar />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-display font-bold text-text-primary dark:text-text-primary-dark">Style Guide</h1>
                <p className="text-text-secondary dark:text-text-secondary-dark mt-2">Component and style reference for Eventila.</p>

                <div className="mt-12">
                    <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark">Colors</h2>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-4">
                        <div className="p-4 rounded-lg bg-primary border border-border-color dark:border-border-color-dark">Primary</div>
                        <div className="p-4 rounded-lg bg-secondary text-white">Secondary</div>
                        <div className="p-4 rounded-lg bg-accent text-white">Accent</div>
                        <div className="p-4 rounded-lg bg-surface border border-border-color dark:border-border-color-dark">Surface</div>
                        <div className="p-4 rounded-lg bg-text-primary text-white">Text Primary</div>
                        <div className="p-4 rounded-lg bg-text-secondary text-white">Text Secondary</div>
                    </div>
                </div>

                <div className="mt-12">
                     <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark">Typography</h2>
                     <div className="space-y-4 mt-4 text-text-primary dark:text-text-primary-dark">
                        <h1 className="font-display text-4xl font-bold">Display Font - Bold 4xl</h1>
                        <h2 className="font-sans text-2xl font-semibold">Sans Font - Semibold 2xl</h2>
                        <p>Body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                     </div>
                </div>

                 <div className="mt-12">
                     <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark">Buttons</h2>
                     <div className="flex items-center space-x-4 mt-4">
                         <button className="bg-accent hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md">Accent Button</button>
                         <button className="bg-surface dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-700/60 text-text-primary dark:text-text-primary-dark font-semibold px-6 py-3 rounded-md">Surface Button</button>
                     </div>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default StyleguidePage;
