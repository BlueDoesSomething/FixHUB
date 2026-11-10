/** Nested pages always return to their own workspace, not an old login/tab/history entry. */
export function backDestination(path: string, role: string): string {
  const parents: Record<string, string> = {
    '/client/request/location': '/client/request',
    '/client/request/review': '/client/request/location',
    '/client/request/matching': '/client/request',
    '/client/request/technician': '/client/request/matching',
    '/client/home/tracking': '/client/home',
    '/client/home/status': '/client/home',
    '/client/care': '/client/home',
    '/technician/active': '/technician/requests',
  };
  if (path.startsWith('/client/requests/')) return '/client/history';
  if (path.startsWith('/client/messages/chat')) return '/client/messages';
  if (path.startsWith('/technician/messages/chat')) return '/technician/messages';
  if (path.startsWith('/client/care/')) return '/client/care';
  return parents[path] ?? (role === 'admin' ? '/admin/dashboard' : role === 'technician' ? '/technician/dashboard' : '/client/home');
}
