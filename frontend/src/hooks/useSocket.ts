import { useEffect, useMemo } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/store/auth';


export const useSocket = () => {
  const accessToken = useAuth((s) => s.accessToken) || localStorage.getItem('accessToken') || undefined;

  const socket = useMemo(() => getSocket(accessToken || undefined), [accessToken]);

  useEffect(() => {
    return () => {
      // do not close globally; components may share the socket
    };
  }, []);

  return socket;
};
