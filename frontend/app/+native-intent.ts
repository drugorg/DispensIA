import { getShareExtensionKey } from 'expo-share-intent';

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: string;
}) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return '/(tabs)/add';
    }
    // Clerk OAuth callback (Google/Apple sign-in su Android arriva come
    // deep link `dispensia:///sso-callback?...`). Senza handling esplicito
    // expo-router cade in +not-found.
    if (path.includes('sso-callback')) {
      return '/sso-callback';
    }
    return path;
  } catch {
    return '/';
  }
}
