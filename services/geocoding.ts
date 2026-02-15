
const CACHE_KEY_PREFIX = 'geocoding_cache_';
const cache: Record<string, string> = {};

export async function fetchAddressFromNominatim(lat: number, lng: number): Promise<string> {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

    if (cache[cacheKey]) {
        return cache[cacheKey];
    }

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'TagPro-App-Nativo',
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim error: ${response.status}`);
        }

        const data = await response.json();
        const address = data.display_name || 'Endereço não encontrado';

        // Store in memory cache
        cache[cacheKey] = address;

        return address;
    } catch (error) {
        console.error('Error fetching address from Nominatim:', error);
        return 'Endereço indisponível';
    }
}
