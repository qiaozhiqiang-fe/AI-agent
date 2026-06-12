<script setup lang="ts">
import type { ChatMode } from '@/types/chat.types';

defineProps<{
  mode: ChatMode;
}>();

const emit = defineEmits<{
  chooseExample: [text: string];
  setMode: [mode: ChatMode];
}>();
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-230px)] max-w-4xl flex-col items-center justify-center text-center">
    <div class="mb-6 flex items-center gap-4">
      <span class="grid h-11 w-11 place-items-center rounded-full bg-[#3f6bff] text-xl font-semibold text-white">
        D
      </span>
      <h1 class="text-3xl font-semibold tracking-normal text-[#202532] md:text-4xl">
        使用快速模式开始对话
      </h1>
    </div>

    <div class="mb-10 inline-flex rounded-full border border-[#e1e5ee] bg-white p-0.5 shadow-sm">
      <button
        :class="[
          'rounded-full px-7 py-3 text-sm font-semibold transition',
          mode === 'quick'
            ? 'bg-[#edf3ff] text-[#3f6bff] ring-1 ring-[#b7c8ff]'
            : 'text-[#202532]',
        ]"
        type="button"
        @click="emit('setMode', 'quick')"
      >
        ⚡ 快速模式
      </button>
      <button
        :class="[
          'rounded-full px-7 py-3 text-sm font-semibold transition',
          mode === 'expert'
            ? 'bg-[#edf3ff] text-[#3f6bff] ring-1 ring-[#b7c8ff]'
            : 'text-[#202532]',
        ]"
        type="button"
        @click="emit('setMode', 'expert')"
      >
        ◇ 专家模式
      </button>
    </div>

    <div class="grid w-full max-w-2xl gap-3 text-left sm:grid-cols-2">
      <button
        class="rounded-2xl border border-[#e4e8f2] bg-white px-5 py-4 text-left text-sm font-medium text-[#4b5567] shadow-sm hover:border-[#b9c9ff]"
        type="button"
        @click="emit('chooseExample', '帮我设计一个 SSE 流式聊天接口的数据结构')"
      >
        设计 SSE 流式接口
      </button>
      <button
        class="rounded-2xl border border-[#e4e8f2] bg-white px-5 py-4 text-left text-sm font-medium text-[#4b5567] shadow-sm hover:border-[#b9c9ff]"
        type="button"
        @click="emit('chooseExample', '帮我根据产品文档拆解前端交互状态')"
      >
        拆解前端交互状态
      </button>
    </div>
  </div>
</template>
