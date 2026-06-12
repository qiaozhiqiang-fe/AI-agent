<script setup lang="ts">
import ChatComposer from '@/components/chat/ChatComposer.vue';
import ChatEmptyState from '@/components/chat/ChatEmptyState.vue';
import ChatMessageList from '@/components/chat/ChatMessageList.vue';
import ChatSidebar from '@/components/chat/ChatSidebar.vue';
import { useChat } from '@/composables/use-chat';

const {
  inputText,
  messages,
  copiedMessageId,
  scrollContainer,
  isNearBottom,
  mode,
  sidebarOpen,
  groupedHistory,
  isStreaming,
  inputTooLong,
  canSend,
  pageStatus,
  sendMessage,
  retryMessage,
  cancelStream,
  newConversation,
  chooseExample,
  copyMessage,
  onScroll,
  scrollToBottom,
  toggleMode,
  setMode,
  setSidebarOpen,
} = useChat();
</script>

<template>
  <main class="flex h-screen overflow-hidden bg-[#f8f9fc] text-[#202532]">
    <ChatSidebar
      :grouped-history="groupedHistory"
      :sidebar-open="sidebarOpen"
      @close-sidebar="setSidebarOpen(false)"
      @new-conversation="newConversation"
    />

    <section class="flex min-w-0 flex-1 flex-col bg-[#fbfcff]">
      <header class="flex h-16 items-center justify-between px-4 lg:hidden">
        <button
          class="rounded-full border border-[#dbe2ff] px-3 py-1.5 text-sm font-semibold text-[#3f6bff]"
          type="button"
          @click="setSidebarOpen(!sidebarOpen)"
        >
          菜单
        </button>
        <span class="font-semibold text-[#3f6bff]">deepseek</span>
        <button
          class="rounded-full border border-[#dbe2ff] px-3 py-1.5 text-sm font-semibold text-[#3f6bff]"
          type="button"
          @click="newConversation"
        >
          新对话
        </button>
      </header>

      <div
        ref="scrollContainer"
        class="relative flex-1 overflow-y-auto px-4 pb-6 pt-6"
        @scroll="onScroll"
      >
        <ChatEmptyState
          v-if="messages.length === 0"
          :mode="mode"
          @choose-example="chooseExample"
          @set-mode="setMode"
        />
        <ChatMessageList
          v-else
          :copied-message-id="copiedMessageId"
          :is-near-bottom="isNearBottom"
          :messages="messages"
          @copy="copyMessage"
          @retry="retryMessage"
          @scroll-to-bottom="scrollToBottom"
        />
      </div>

      <ChatComposer
        v-model:input-text="inputText"
        :can-send="canSend"
        :input-too-long="inputTooLong"
        :is-streaming="isStreaming"
        :mode="mode"
        :page-status="pageStatus"
        @cancel="cancelStream"
        @send="sendMessage()"
        @toggle-mode="toggleMode"
      />
    </section>
  </main>
</template>
