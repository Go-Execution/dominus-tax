import { ArrowRight, Calendar } from 'lucide-react';
import { blogs } from '@/data/blogs';

export default function BlogList({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section id="blog-list" className="py-24 bg-dominus-black relative border-t border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-dominus-gold/5 via-transparent to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-dominus-text-primary mb-6">
            Tax <span className="text-gradient-gold">Insights</span> & Updates
          </h1>
          <p className="text-lg text-dominus-text-secondary font-montserrat">
            Stay informed with the latest tax tips, financial strategies, and news for individuals and businesses in the Permian Basin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, index) => (
            <div 
              key={blog.id}
              className="bg-dominus-charcoal/50 border border-white/5 rounded-2xl overflow-hidden hover:border-dominus-gold/30 transition-all duration-300 group flex flex-col h-full"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={blog.image} 
                  alt={blog.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dominus-black to-transparent opacity-80" />
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-xs font-montserrat text-dominus-gold-light/70 mb-4">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {blog.date}</span>
                </div>
                
                <h3 className="text-xl font-serif font-semibold text-dominus-text-primary mb-3 group-hover:text-dominus-gold transition-colors line-clamp-2">
                  {blog.title}
                </h3>
                
                <p className="text-dominus-text-secondary text-sm font-montserrat mb-6 line-clamp-3 flex-grow">
                  {blog.excerpt}
                </p>
                
                <button 
                  onClick={() => onNavigate(`#blog/${blog.id}`)}
                  className="flex items-center gap-2 text-dominus-gold font-montserrat font-medium text-sm hover:text-dominus-gold-light transition-colors mt-auto w-fit"
                >
                  Read Article <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
