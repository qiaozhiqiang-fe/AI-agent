<script setup lang="ts">
import type { ChatMode } from '@/types/chat.types';

const inputText = defineModel<string>('inputText', { required: true });

defineProps<{
  mode: ChatMode;
  pageStatus: string;
  inputTooLong: boolean;
  canSend: boolean;
  isStreaming: boolean;
}>();

const emit = defineEmits<{
  send: [];
  cancel: [];
  toggleMode: [];
}>();

function handleTextareaKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
    return;
  }

  event.preventDefault();
  emit('send');
}
</script>

<template>
  <footer class="border-t border-transparent px-4 pb-6">
    <form
      class="mx-auto max-w-4xl rounded-[28px] border border-[#e1e5ee] bg-white p-4 shadow-[0_10px_30px_rgba(18,24,40,0.08)]"
      @submit.prevent="emit('send')"
    >
      <textarea
        v-model="inputText"
        class="min-h-20 w-full resize-none border-0 bg-transparent px-2 text-lg leading-8 text-[#202532] outline-none placeholder:text-[#aab1bf]"
        maxlength="8200"
        placeholder="给 DeepSeek 发送消息"
        rows="2"
        @keydown="handleTextareaKeydown"
      />

      <div class="mt-3 flex items-center gap-3">
        <button
          :class="[
            'rounded-full border px-4 py-2 text-sm font-semibold',
            mode === 'expert'
              ? 'border-[#b7c8ff] bg-[#edf3ff] text-[#3f6bff]'
              : 'border-[#dbe2ff] text-[#3f6bff]',
          ]"
          type="button"
          @click="emit('toggleMode')"
        >
          ⌘ 深度思考
        </button>
        <button
          class="rounded-full border border-[#dbe2ff] px-4 py-2 text-sm font-semibold text-[#3f6bff]"
          type="button"
        >
          ◎ 智能搜索
        </button>
        <span
          v-if="inputTooLong"
          class="text-sm text-red-500"
        >
          输入内容过长
        </span>
        <span
          v-else
          class="hidden text-sm text-[#9aa1ad] sm:inline"
        >
          Enter 发送，Shift + Enter 换行 · {{ pageStatus }}
        </span>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="grid h-10 w-10 place-items-center rounded-full text-xl text-[#202532] hover:bg-[#f2f4f8]"
            type="button"
            aria-label="附件"
          >
            ⌘
          </button>
          <button
            v-if="isStreaming"
            class="grid h-12 w-12 place-items-center rounded-full bg-[#202532] text-sm font-semibold text-white"
            type="button"
            @click="emit('cancel')"
          >
            停
          </button>
          <button
            v-else
            :disabled="!canSend"
            :class="[
              'grid h-12 w-12 place-items-center rounded-full text-2xl font-semibold transition',
              canSend
                ? 'bg-[#9eb2ff] text-white hover:bg-[#7f9aff]'
                : 'bg-[#dfe5ff] text-white/80',
            ]"
            type="submit"
            aria-label="发送"
          >
            ↑
          </button>
        </div>
      </div>
    </form>
  </footer>
</template>
