<script setup lang="ts">
import type { ConversationItem } from '@/types/chat.types';

defineProps<{
  groupedHistory: Array<{
    group: ConversationItem['group'];
    items: ConversationItem[];
  }>;
  sidebarOpen: boolean;
}>();

const emit = defineEmits<{
  newConversation: [];
  closeSidebar: [];
}>();
</script>

<template>
  <aside
    :class="[
      'hidden w-[280px] shrink-0 border-r border-[#e6e8ef] bg-[#f4f6fa] px-5 py-6 lg:flex lg:flex-col',
      sidebarOpen ? '' : 'lg:hidden',
    ]"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-2xl font-semibold text-[#3f6bff]">
        <span class="grid h-8 w-8 place-items-center rounded-full bg-[#3f6bff] text-base text-white">
          D
        </span>
        <span>deepseek</span>
      </div>
      <div class="flex items-center gap-3 text-[#7d8494]">
        <button
          class="rounded-full p-1.5 hover:bg-white"
          type="button"
          aria-label="搜索"
        >
          <span class="text-xl">⌕</span>
        </button>
        <button
          class="rounded-full p-1.5 hover:bg-white"
          type="button"
          aria-label="折叠侧边栏"
          @click="emit('closeSidebar')"
        >
          <span class="text-xl">▱</span>
        </button>
      </div>
    </div>

    <button
      class="mt-9 flex h-14 items-center justify-center gap-2 rounded-full bg-white text-base font-semibold text-[#202532] shadow-[0_2px_12px_rgba(18,24,40,0.09)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(18,24,40,0.12)]"
      type="button"
      @click="emit('newConversation')"
    >
      <span class="text-xl">⊕</span>
      开启新对话
    </button>

    <nav class="mt-8 flex-1 overflow-y-auto pr-1">
      <section
        v-for="group in groupedHistory"
        :key="group.group"
        class="mb-8"
      >
        <h2 class="px-2 text-sm font-semibold text-[#9aa1ad]">
          {{ group.group }}
        </h2>
        <button
          v-for="item in group.items"
          :key="item.id"
          :class="[
            'mt-3 block w-full truncate rounded-lg px-2 py-1.5 text-left text-[15px] font-medium leading-7',
            item.active
              ? 'bg-white text-[#202532] shadow-sm'
              : 'text-[#343946] hover:bg-white/70',
          ]"
          type="button"
        >
          {{ item.title }}
        </button>
      </section>
    </nav>

    <div class="flex items-center gap-3 pt-4">
      <div class="grid h-10 w-10 place-items-center rounded-full bg-[#ffd766] font-semibold">
        乔
      </div>
      <span class="font-medium">乔治</span>
      <button
        class="ml-auto rounded-full px-2 text-xl text-[#7d8494] hover:bg-white"
        type="button"
        aria-label="更多"
      >
        ...
      </button>
    </div>
  </aside>
</template>
