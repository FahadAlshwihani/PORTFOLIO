import React from "react";

const Blog = () => {
  const posts = [
    { title: "Designing for Performance", date: "2025-06-12", excerpt: "Tips for UX + speed." },
    { title: "Shader-driven Backgrounds", date: "2025-04-03", excerpt: "Using WebGL for mood." },
  ];

  return (
    <section id="blog" className="page-section">
      <div className="section-inner">
        <h2 className="section-title">Blog</h2>
        <p className="section-desc">Short reads on design, performance, and front-end engineering.</p>

        <div className="posts-grid">
          {posts.map((p, i) => (
            <article key={i} className="post-card">
              <h3>{p.title}</h3>
              <time>{p.date}</time>
              <p>{p.excerpt}</p>
              <button className="btn btn-ghost">Read</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
