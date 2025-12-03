import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import FileUpload from './FileUpload';

interface ProjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [productPreview, setProductPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleProductSelect = (file: File) => {
    setProductFile(file);
    setProductPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let logoUrl = '';
      let productUrl = '';

      if (logoFile) {
        const logoPath = `${user.id}/${Date.now()}-${logoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(logoPath, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(logoPath);
        logoUrl = publicUrl;
      }

      if (productFile) {
        const productPath = `${user.id}/${Date.now()}-${productFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(productPath, productFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(productPath);
        productUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          brand_name: brandName,
          logo_url: logoUrl || null,
          product_image_url: productUrl || null,
        });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Projects</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h2>
          <p className="text-gray-600 mb-8">Set up your brand assets to generate creative variations</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Summer Campaign 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Nike"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FileUpload
                label="Brand Logo (Optional)"
                onFileSelect={handleLogoSelect}
                preview={logoPreview}
                onClear={() => {
                  setLogoFile(null);
                  setLogoPreview('');
                }}
              />

              <FileUpload
                label="Product Image (Optional)"
                onFileSelect={handleProductSelect}
                preview={productPreview}
                onClear={() => {
                  setProductFile(null);
                  setProductPreview('');
                }}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Save size={20} />
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
