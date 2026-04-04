import { TagWithMac } from './tagsService';

export const matcherService = {
  /**
   * Verifica se o MAC encontrado corresponde a alguma tag do usuário.
   */
  findMatchingTag(scannedMac: string, tags: TagWithMac[]): TagWithMac | null {
    if (!scannedMac || !tags || tags.length === 0) return null;
    
    // Convert to uppercase for case-insensitive comparison
    const normalizedScannedMac = scannedMac.toUpperCase().trim();
    
    return tags.find(tag => {
      if (!tag.mac || tag.mac.trim() === '' || tag.mac.trim() === '0') return false;
      return tag.mac.toUpperCase().trim() === normalizedScannedMac;
    }) || null;
  }
};
