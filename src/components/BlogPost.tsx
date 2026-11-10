import { useEffect } from 'react';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { blogs } from '@/data/blogs';

export default function BlogPost({ id, onNavigate }: { id: string; onNavigate: (path: string) => void }) {
  const blog = blogs.find(b => b.id === id);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (!blog) {
    return (
      <div className="min-h-screen pt-32 pb-24 text-center">
        <h2 className="text-2xl font-serif text-white mb-4">Article Not Found</h2>
        <button onClick={() => onNavigate('#blog')} className="text-dominus-gold hover:underline">
          Return to Blog
        </button>
      </div>
    );
  }

  return (
    <article className="pt-32 pb-24 bg-dominus-black relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => onNavigate('#blog')}
          className="flex items-center gap-2 text-dominus-text-secondary hover:text-dominus-gold transition-colors mb-8 font-montserrat text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Articles
        </button>

        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-6 text-sm font-montserrat text-dominus-gold-light mb-6">
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {blog.date}</span>
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> {blog.author}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-dominus-text-primary leading-tight mb-8">
            {blog.title}
          </h1>
          <div className="rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] w-full border border-white/10 shadow-2xl">
            <img 
              src={blog.image} 
              alt={blog.title} 
              className="w-full h-full object-cover"
              width={1672}
              height={941}
            />
          </div>
        </div>

        <div 
          className="prose prose-invert prose-lg max-w-none font-montserrat prose-headings:font-serif prose-p:text-dominus-text-secondary prose-a:text-dominus-gold hover:prose-a:text-dominus-gold-light"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>
    </article>
  );
}
