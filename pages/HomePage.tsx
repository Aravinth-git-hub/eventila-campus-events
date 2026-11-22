import React, {useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import { TicketIcon, UsersIcon, ChartBarIcon, CheckCircleIcon, ChevronDownIcon } from '../components/icons/IconCollection';
import { apiFetchTestimonials } from '../api';
import type { Testimonial } from '../types';
import Footer from '../components/layout/Footer';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="bg-surface dark:bg-surface-dark p-6 rounded-lg text-left">
        <div className="flex items-center space-x-4">
            <div className="bg-accent/10 p-3 rounded-lg text-accent">
                {icon}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-text-primary dark:text-text-primary-dark">{title}</h3>
            </div>
        </div>
        <p className="text-text-secondary dark:text-text-secondary-dark mt-4 text-sm">{description}</p>
    </div>
);

const FaqItem: React.FC<{ question: string; answer: string; }> = ({ question, answer }) => (
  <details className="group border-b border-border-color dark:border-border-color-dark py-4">
    <summary className="flex justify-between items-center cursor-pointer list-none">
      <span className="font-medium text-text-primary dark:text-text-primary-dark">{question}</span>
      <ChevronDownIcon className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark transition-transform duration-300 group-open:rotate-180" />
    </summary>
    <p className="mt-4 text-text-secondary dark:text-text-secondary-dark text-sm">{answer}</p>
  </details>
);

const HomePage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  useEffect(() => {
    apiFetchTestimonials().then(setTestimonials);
  }, []);

  return (
    <div className="bg-primary dark:bg-primary-dark">
      <PublicNavbar />
      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-28 text-center border-b border-border-color dark:border-border-color-dark">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-6xl font-extrabold text-text-primary dark:text-text-primary-dark mb-4 leading-tight">
              The Premier Platform for <br/> <span className="text-accent">Campus Events</span>
            </h1>
            <p className="text-md md:text-lg text-text-secondary dark:text-text-secondary-dark max-w-2xl mx-auto mb-8">
              From faculty-led workshops to inter-college festivals, Eventila is the centralized hub for seamless event management, approvals, and engagement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/signup" className="w-full sm:w-auto bg-accent hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md transition-transform duration-200 hover:scale-105">
                Get Started
              </Link>
              <Link to="/events" className="w-full sm:w-auto bg-surface dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-700/60 text-text-primary dark:text-text-primary-dark font-semibold px-6 py-3 rounded-md transition-colors duration-200">
                Explore Events
              </Link>
              <Link to="/events" className="w-full sm:w-auto bg-teal/10 hover:bg-teal/20 text-teal font-semibold px-6 py-3 rounded-md border border-teal/20 transition-colors duration-200">
                Guest Mode
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-primary dark:bg-primary-dark">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Everything You Need to Succeed</h2>
                    <p className="text-text-secondary dark:text-text-secondary-dark mt-4">
                        Eventila provides powerful, role-based tools to streamline every aspect of event management for your entire institution.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                    <FeatureCard
                        icon={<CheckCircleIcon className="h-6 w-6" />}
                        title="Approval Workflows"
                        description="Faculty submit events, and HODs or Principals can approve or reject them in a seamless, transparent process."
                    />
                    <FeatureCard
                        icon={<TicketIcon className="h-6 w-6" />}
                        title="Role-Based Access"
                        description="Custom dashboards and permissions for faculty, students, and higher authorities ensure everyone sees what they need."
                    />
                    <FeatureCard
                        icon={<UsersIcon className="h-6 w-6" />}
                        title="Simplified Registration"
                        description="Easy registration for both inter-college students (with login) and outer-college participants (publicly)."
                    />
                    <FeatureCard
                        icon={<ChartBarIcon className="h-6 w-6" />}
                        title="Powerful Analytics"
                        description="Gain insights into event performance, participant demographics, and registration trends."
                    />
                </div>
            </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-surface dark:bg-surface-dark">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Loved by Campuses Everywhere</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="bg-primary dark:bg-primary-dark p-6 rounded-lg shadow-sm">
                            <p className="text-text-secondary dark:text-text-secondary-dark italic mb-4">"{testimonial.quote}"</p>
                            <div className="flex items-center">
                                <img src={testimonial.imageUrl} alt={testimonial.name} className="w-10 h-10 rounded-full mr-4" />
                                <div>
                                    <p className="font-semibold text-text-primary dark:text-text-primary-dark">{testimonial.name}</p>
                                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-primary dark:bg-primary-dark">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center">
                    <h2 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Frequently Asked Questions</h2>
                </div>
                <div className="mt-12">
                    <FaqItem
                        question="Who can create events on Eventila?"
                        answer="Events can be created by registered Faculty members. Once created, they are sent to the designated Head of Department (HOD) or Principal for approval before being published."
                    />
                    <FaqItem
                        question="How do students from other colleges register?"
                        answer="Events designated for an 'outer-college' audience are visible on a public page. Students from other institutions can register through a simple form without needing to create an account."
                    />
                    <FaqItem
                        question="What happens if an event's details change?"
                        answer="If a faculty member updates the details of an approved event (like time or venue), all registered inter-college students automatically receive an in-app and email notification about the change."
                    />
                </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
