import type { FileBean, FileDetail } from './define';

export default function (file: FileDetail): FileBean {
  const documentExt = [
    'TXT',
    'MD',
    'MARKDOWN',
    'PDF',
    'HTML',
    'XLSX',
    'XLS',
    'DOCX',
    'CSV',
    'EML',
    'MSG',
    'PPTX',
    'PPT',
    'XML',
    'EPUB',
  ];
  const imageExt = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'];
  const audioExt = ['MP3', 'M4A', 'WAV', 'WEBM', 'AMR'];
  const videoExt = ['MP4', 'MOV', 'MPEG', 'MPGA'];
  const ext = file.name.split('.').pop();
  let type: FileBean['type'] = 'custom';
  if (!ext) {
    return {
      uploadFileId: file.id,
      type: 'custom',
    };
  } else if (documentExt.includes(ext.toUpperCase())) {
    type = 'document';
  } else if (imageExt.includes(ext.toUpperCase())) {
    type = 'image';
  } else if (audioExt.includes(ext.toUpperCase())) {
    type = 'audio';
  } else if (videoExt.includes(ext.toUpperCase())) {
    type = 'video';
  }
  return {
    uploadFileId: file.id,
    type,
  };
}
