import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useUserStore } from "./userStore";

export const useChatStore = create(
  persist(
    (set) => ({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
      showDetail: false,
      toggleDetail: () => set((state) => ({ showDetail: !state.showDetail })),

      changeChat: (chatId, user) => {
        const currentUser = useUserStore.getState().currentUser;

        if (user.blocked.includes(currentUser.id)) {
          return set({
            chatId,
            user: null,
            isCurrentUserBlocked: true,
            isReceiverBlocked: false,
            showDetail: false,
          });
        } else if (currentUser.blocked.includes(user.id)) {
          return set({
            chatId,
            user,
            isCurrentUserBlocked: false,
            isReceiverBlocked: true,
            showDetail: false,
          });
        } else {
          return set({
            chatId,
            user,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
            showDetail: false,
          });
        }
      },

      changeBlock: () => {
        set((state) => ({ isReceiverBlocked: !state.isReceiverBlocked }));
      },

      resetChat: () => {
        set({
          chatId: null,
          user: null,
          isCurrentUserBlocked: false,
          isReceiverBlocked: false,
          showDetail: false,
        });
      },
    }),
    {
      name: "chat-store", // Name of the storage key
      getStorage: () => localStorage, // Persist in localStorage
    }
  )
);
