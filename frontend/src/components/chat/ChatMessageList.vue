<script setup lang="ts">
import type { ChatMessage } from '@/types/chat.types';

defineProps<{
  messages: ChatMessage[];
  copiedMessageId: string;
  isNearBottom: boolean;
}>();

const emit = defineEmits<{
  retry: [message: ChatMessage];
  copy: [message: ChatMessage];
  scrollToBottom: [];
}>();

function statusText(message: ChatMessage) {
  if (message.status === 'loading') {
    return '正在连接';
  }

  if (message.status === 'streaming') {
    return '正在生成';
  }

  if (message.status === 'canceled') {
    return '已取消，已保留部分内容';
  }

  if (message.status === 'error') {
    return message.errorMessage || '生成失败';
  }

  return '';
}

function canCopyMessage(message: ChatMessage) {
  return (
    message.role === 'assistant' &&
    Boolean(message.content) &&
    (message.status === 'done' ||
      message.status === 'canceled' ||
      message.status === 'error')
  );
}
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">
    <div
      v-for="message in messages"
      :key="message.id"
      :class="[
        'flex',
        message.role === 'user' ? 'justify-end' : 'justify-start',
      ]"
    >
      <article
        :class="[
          'max-w-[86%] rounded-3xl px-5 py-4 text-left shadow-sm',
          message.role === 'user'
            ? 'bg-[#3f6bff] text-white'
            : 'border border-[#e5e9f2] bg-white text-[#202532]',
        ]"
      >
        <div
          v-if="message.role === 'assistant'"
          class="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3f6bff]"
        >
          <span class="grid h-6 w-6 place-items-center rounded-full bg-[#edf3ff] text-xs">
            D
          </span>
          <span>DeepSeek</span>
        </div>

        <p
          v-if="message.content"
          class="whitespace-pre-wrap break-words text-[15px] leading-7"
        >
          {{ message.content }}
        </p>
        <p
          v-else
          class="text-[15px] leading-7 text-[#8c95a6]"
        >
          正在连接...
        </p>

        <div
          v-if="statusText(message)"
          :class="[
            'mt-3 text-xs',
            message.role === 'user' ? 'text-white/75' : 'text-[#7d8494]',
            message.status === 'error' ? 'text-red-500' : '',
          ]"
        >
          {{ statusText(message) }}
        </div>
        <div
          v-if="message.actionMessage"
          class="mt-3 text-xs text-[#7d8494]"
        >
          {{ message.actionMessage }}
        </div>

        <div
          v-if="message.role === 'assistant'"
          class="mt-4 flex flex-wrap gap-2"
        >
          <button
            v-if="message.status === 'error'"
            class="rounded-full border border-[#dbe2ff] px-3 py-1.5 text-xs font-semibold text-[#3f6bff] hover:bg-[#edf3ff]"
            type="button"
            @click="emit('retry', message)"
          >
            重试
          </button>
          <button
            v-if="canCopyMessage(message)"
            class="rounded-full border border-[#e4e8f2] px-3 py-1.5 text-xs font-semibold text-[#5f6878] hover:bg-[#f4f7ff]"
            type="button"
            @click="emit('copy', message)"
          >
            {{ copiedMessageId === message.id ? '已复制' : '复制' }}
          </button>
        </div>
      </article>
    </div>
  </div>

  <button
    v-if="!isNearBottom"
    class="fixed bottom-36 right-8 rounded-full bg-[#202532] px-4 py-2 text-sm font-semibold text-white shadow-lg"
    type="button"
    @click="emit('scrollToBottom')"
  >
    回到底部
  </button>
</template>
