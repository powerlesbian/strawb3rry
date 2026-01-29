import { Lightbulb } from 'lucide-react';

export default function LearningsPage() {
  return (
    <div className="text-center py-16">
      <Lightbulb size={48} className="mx-auto text-slate-600 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Learnings</h2>
      <p className="text-slate-400">Your captured learnings will appear here.</p>
    </div>
  );
}
