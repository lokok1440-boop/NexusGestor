/**
 * Supabase Storage Service - NexusGestor
 * 
 * Substitui o Google Drive pelo Supabase Storage.
 * As credenciais vêm do arquivo .env.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase Storage configurado com sucesso.');
} else {
  console.warn('⚠️ Credenciais do Supabase não encontradas no .env. Armazenamento local será usado.');
}

const supabaseStorageService = {
  isEnabled() {
    return supabase !== null;
  },

  /**
   * Upload de arquivo local (salvo temporariamente pelo multer)
   */
  async uploadLocalFile(localFilePath, filename, mimeType, type = 'producao') {
    if (!this.isEnabled()) {
      return this._fallbackLocal(localFilePath, filename, type);
    }

    try {
      const fileBuffer = fs.readFileSync(localFilePath);
      const filePath = `${type}/${Date.now()}_${filename.replace(/\s+/g, '_')}`;

      // Upload para o bucket "producao" (garanta que este bucket exista e seja público)
      const { data, error } = await supabase.storage
        .from('producao')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false
        });

      if (error) throw error;

      // Pegar a URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from('producao')
        .getPublicUrl(filePath);

      // Limpar o arquivo temporário
      fs.unlink(localFilePath, (err) => {
        if (err) console.error(`⚠️ Erro ao remover temporário:`, err.message);
      });

      return {
        success: true,
        path: publicUrlData.publicUrl,
        filename,
        isDrive: true, // Mantemos essa key apenas por compatibilidade com front-end se houver
        fileId: publicUrlData.publicUrl
      };
    } catch (error) {
      console.error('❌ Erro no upload para Supabase:', error.message);
      return this._fallbackLocal(localFilePath, filename, type);
    }
  },

  /**
   * Upload de imagem em Base64 (Assinaturas)
   */
  async uploadBase64(base64Data, filename, mimeType = 'image/png', type = 'assinaturas') {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (!this.isEnabled()) {
      return this._fallbackBase64Local(cleanBase64, filename, type);
    }

    try {
      const filePath = `${type}/${Date.now()}_${filename.replace(/\s+/g, '_')}`;

      const { data, error } = await supabase.storage
        .from('producao')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('producao')
        .getPublicUrl(filePath);

      return {
        success: true,
        path: publicUrlData.publicUrl,
        filename,
        isDrive: true,
        fileId: publicUrlData.publicUrl
      };
    } catch (error) {
      console.error('❌ Erro no upload Base64 para Supabase:', error.message);
      return this._fallbackBase64Local(cleanBase64, filename, type);
    }
  },

  // Fallbacks para disco local
  _fallbackLocal(localFilePath, filename, type) {
    const dir = path.join(__dirname, '..', 'uploads', type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const localDest = path.join(dir, filename);
    fs.copyFileSync(localFilePath, localDest);
    return { success: true, path: `/uploads/${type}/${filename}`, filename, isDrive: false };
  },

  _fallbackBase64Local(cleanBase64, filename, type) {
    const dir = path.join(__dirname, '..', 'uploads', type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const localDest = path.join(dir, filename);
    fs.writeFileSync(localDest, cleanBase64, 'base64');
    return { success: true, path: `/uploads/${type}/${filename}`, filename, isDrive: false };
  }
};

module.exports = supabaseStorageService;
