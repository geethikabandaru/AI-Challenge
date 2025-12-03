import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase, Project, GeneratedCreative } from '../lib/supabase';

interface CreativeGeneratorProps {
  project: Project;
  onBack: () => void;
}

export default function CreativeGenerator({ project, onBack }: CreativeGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [creatives, setCreatives] = useState<GeneratedCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    loadCreatives();
  }, [project.id]);

  const loadCreatives = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_creatives')
        .select('*')
        .eq('project_id', project.id)
        .order('variation_number', { ascending: true });

      if (error) throw error;
      setCreatives(data || []);
    } catch (error) {
      console.error('Error loading creatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCreatives = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      setProgress(20);

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-creatives`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          projectId: project.id,
          brandName: project.brand_name,
          logoUrl: project.logo_url,
          productImageUrl: project.product_image_url,
          variations: 12,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate creatives');
      }

      const result = await response.json();
      setProgress(60);

      await supabase
        .from('generated_creatives')
        .delete()
        .eq('project_id', project.id);

      const creativesToInsert = result.creatives.map((creative: { imageUrl: string; caption: string; prompt: string }, index: number) => ({
        project_id: project.id,
        image_url: creative.imageUrl,
        caption: creative.caption,
        generation_prompt: creative.prompt,
        variation_number: index + 1,
      }));

      const { error: insertError } = await supabase
        .from('generated_creatives')
        .insert(creativesToInsert);

      if (insertError) throw insertError;

      setProgress(100);
      await loadCreatives();
    } catch (error) {
      console.error('Error generating creatives:', error);
      alert('Failed to generate creatives. Please try again.');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const downloadAsZip = async () => {
    setDownloadingZip(true);
    try {
      const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
      const zip = new JSZip();

      const captionsText = creatives.map((creative, index) =>
        `Image ${index + 1}:\n${creative.caption}\n\nPrompt: ${creative.generation_prompt}\n\n---\n\n`
      ).join('');

      zip.file('captions.txt', captionsText);

      for (let i = 0; i < creatives.length; i++) {
        const creative = creatives[i];
        try {
          const response = await fetch(creative.image_url);
          const blob = await response.blob();
          zip.file(`creative_${creative.variation_number}.jpg`, blob);
        } catch (error) {
          console.error(`Failed to fetch image ${i + 1}:`, error);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, '_')}_creatives.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip:', error);
      alert('Failed to download zip file. Please try again.');
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Projects</span>
            </button>
            {creatives.length > 0 && (
              <button
                onClick={downloadAsZip}
                disabled={downloadingZip}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingZip ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating ZIP...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download All as ZIP
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 text-lg mb-4">{project.brand_name}</p>
              {creatives.length > 0 && (
                <p className="text-sm text-gray-500">
                  {creatives.length} creative variations generated
                </p>
              )}
            </div>
            <button
              onClick={generateCreatives}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Creatives
                </>
              )}
            </button>
          </div>

          {generating && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Generating creative variations...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                <div className="w-full h-64 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : creatives.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full mb-4">
              <ImageIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No creatives yet</h3>
            <p className="text-gray-600 mb-6">
              Click "Generate Creatives" to create AI-powered variations
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatives.map((creative) => (
              <div
                key={creative.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={creative.image_url}
                    alt={`Creative ${creative.variation_number}`}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                    #{creative.variation_number}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 line-clamp-3">{creative.caption}</p>
                  <a
                    href={creative.image_url}
                    download={`creative_${creative.variation_number}.jpg`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
