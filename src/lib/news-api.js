// Update the useCategoryNews hook around line 135
export const useCategoryNews = (category = 'All') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async (bypass = false) => {
    try {
      setLoading(true);
      setError(null);
      const news = await fetchNews(category, 0, bypass);
      const processedNews = news.map(item => ({
        ...item,
        image_url: item.image_url || item.thumbnail_url || null
      }));
      setData(processedNews);
    } catch (e) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    run();
    const id = setInterval(() => run(false), 20 * 60 * 1000);
    return () => clearInterval(id);
  }, [run]);

  return { data, loading, error, refetch: () => run(false), forceRefresh: () => run(true) };
};
