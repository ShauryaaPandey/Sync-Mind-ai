interface Props {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export const SentimentBadge = ({ sentiment }: Props) => {
  const styles = {
    Positive: 'bg-green-500/10 text-green-400 border-green-500/20',
    Neutral: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
    Negative: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${styles[sentiment] || styles.Neutral}`}>
      {sentiment}
    </span>
  );
};