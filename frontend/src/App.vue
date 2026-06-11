<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { http } from '@/services/http';

type ExampleResponse = {
  code: number;
  message: string;
  data: {
    appName: string;
    serverTime: string;
  };
};

const loading = ref(true);
const errorMessage = ref('');
const example = ref<ExampleResponse | null>(null);

onMounted(async () => {
  try {
    const { data } = await http.get<ExampleResponse>('/example');
    example.value = data;
  } catch {
    errorMessage.value = '接口调用失败，请检查后端服务是否已启动。';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
    <section class="mx-auto max-w-4xl">
      <h1 class="text-3xl font-semibold">
        Frontend
      </h1>
      <p class="mt-3 text-slate-600">
        Vue 3 + TypeScript + Vite 基础项目已就绪。
      </p>

      <div class="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-medium">
          接口调用验证
        </h2>

        <p
          v-if="loading"
          class="mt-4 text-slate-500"
        >
          正在请求后端示例接口...
        </p>

        <p
          v-else-if="errorMessage"
          class="mt-4 text-red-600"
        >
          {{ errorMessage }}
        </p>

        <dl
          v-else-if="example"
          class="mt-4 grid gap-3 text-sm"
        >
          <div class="flex gap-3">
            <dt class="w-24 text-slate-500">
              状态码
            </dt>
            <dd class="font-medium">
              {{ example.code }}
            </dd>
          </div>
          <div class="flex gap-3">
            <dt class="w-24 text-slate-500">
              返回消息
            </dt>
            <dd
              class="font-medium text-emerald-700"
            >
              {{ example.message }}
            </dd>
          </div>
          <div
            class="flex gap-3"
          >
            <dt class="w-24 text-slate-500">
              应用名称
            </dt>
            <dd>{{ example.data.appName }}</dd>
          </div>
          <div class="flex gap-3">
            <dt class="w-24 text-slate-500">
              服务时间
            </dt>
            <dd>{{ example.data.serverTime }}</dd>
          </div>
        </dl>
      </div>
    </section>
  </main>
</template>
