import { checkPremiumStatus } from '../../lib/premium';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const isPremium = await checkPremiumStatus(userId);

    return Response.json({ 
      isPremium,
      checkedAt: new Date().toISOString() 
    });
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
