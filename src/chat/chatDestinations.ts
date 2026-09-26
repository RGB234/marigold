import type { TSID_String } from '@/global/types/common';

export const chatDestinations = {
  messageSend: '/pub/chat/message',
  room: (roomId: TSID_String) => `/sub/chat/room/${roomId}`,
  errorQueue: '/user/queue/errors',
};
