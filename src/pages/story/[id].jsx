import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchStoryById, fetchRelatedStories } from '@/lib/news-api';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';

const StoryPage = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [story, setStory] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchStoryById(id);
        if (!result) {
          toast({ title: "Story not found", variant: "destructive" });
          return;
        }
        setStory(result);
        const rel = await fetchRelatedStories(result.category, id);
        setRelated(rel);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load story", variant: "destructive" });
      }
    };

    loadData();
  }, [id]);

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading story...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4">
      <Header />

      <main className="max-w-4xl mx-auto my-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card shadow-md rounded-lg p-6"
        >
          <h1 className="text-2xl font-bold mb-3">{story.title}</h1>

          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <span className="mr-4">Category: <strong>{story.category}</strong></span>
            <span>Source: <a href={story.url} target="_blank" rel="noopener noreferrer" className="underline">{story.source_name}</a></span>
          </div>

          {story.image_url && (
            <img
              src={story.image_url}
              alt={story.title}
              className="rounded-md w-full h-64 object-cover mb-4"
            />
          )}

          <p className="text-base leading-relaxed mb-6">{story.summary}</p>

          <hr className="my-6 border-t border-border" />

          {related.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Related Stories in {story.category}</h2>
              <ul className="space-y-2">
                {related.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm block"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default StoryPage;
