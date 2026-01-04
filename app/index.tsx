import { Redirect } from 'expo-router';

export default function Index() {
  // Redireciona para o grupo (tabs).
  // O arquivo app/(tabs)/_layout.tsx cuidará de verificar se o usuário
  // está logado e redirecionar para /login se necessário.
  return <Redirect href="/(tabs)" />;
}
