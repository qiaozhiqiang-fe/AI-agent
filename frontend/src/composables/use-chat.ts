import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { streamChat } from '@/services/chat-stream';
import type {
  ChatContextMessage,
  ChatMessage,
  ChatMessageStatus,
  ChatMode,
  ChatRole,
  ConversationItem,
} from '@/types/chat.types';

const maxInputLength = 8000;

const initialHistory: ConversationItem[] = [
  {
    id: 'today-1',
    title: 'MCP在AI编程中的作用',
    group: '今天',
    active: true,
  },
  { id: 'yesterday-1', title: 'Codex Skills详解与示例', group: '昨天' },
  { id: 'yesterday-2', title: 'Vue3前端技术选型', group: '昨天' },
  { id: 'yesterday-3', title: 'Mac安装Codex报错解决', group: '昨天' },
  { id: 'week-1', title: 'Claude Console与Claude区别', group: '7 天内' },
  { id: 'week-2', title: 'Claude购买方式区别', group: '7 天内' },
  { id: 'week-3', title: '静音音频文件获取指南', group: '7 天内' },
  { id: 'month-1', title: '前端转产品经理有希望', group: '30 天内' },
];

export function useChat() {
  const inputText = ref('');
  const messages = ref<ChatMessage[]>([]);
  const conversationId = ref('');
  const currentController = ref<AbortController | null>(null);
  const activeAssistantId = ref('');
  const copiedMessageId = ref('');
  const scrollContainer = ref<HTMLElement | null>(null);
  const isNearBottom = ref(true);
  const mode = ref<ChatMode>('quick');
  const sidebarOpen = ref(true);
  const historyItems = ref<ConversationItem[]>([...initialHistory]);

  const groupedHistory = computed(() => {
    const groups: ConversationItem['group'][] = [
      '今天',
      '昨天',
      '7 天内',
      '30 天内',
    ];

    return groups
      .map((group) => ({
        group,
        items: historyItems.value.filter((item) => item.group === group),
      }))
      .filter(({ items }) => items.length > 0);
  });

  const isStreaming = computed(() =>
    messages.value.some(
      (message) =>
        message.role === 'assistant' &&
        (message.status === 'loading' || message.status === 'streaming'),
    ),
  );

  const trimmedInput = computed(() => inputText.value.trim());
  const inputTooLong = computed(() => inputText.value.length > maxInputLength);
  const canSend = computed(
    () =>
      Boolean(trimmedInput.value) && !inputTooLong.value && !isStreaming.value,
  );

  const pageStatus = computed(() => {
    if (isStreaming.value) {
      return '正在生成';
    }

    const lastMessage = messages.value[messages.value.length - 1];

    if (!lastMessage) {
      return '空会话';
    }

    if (lastMessage.status === 'error') {
      return '生成失败';
    }

    if (lastMessage.status === 'canceled') {
      return '已取消';
    }

    return '已完成';
  });

  async function sendMessage(text = trimmedInput.value) {
    const messageText = text.trim();

    if (
      !messageText ||
      isStreaming.value ||
      messageText.length > maxInputLength
    ) {
      return;
    }

    inputText.value = '';
    const userMessage = createMessage('user', messageText, 'done');
    const assistantMessage = createMessage('assistant', '', 'loading', {
      sourceUserMessageId: userMessage.id,
    });

    messages.value.push(userMessage, assistantMessage);
    activeAssistantId.value = assistantMessage.id;
    await scrollToBottom();

    await startStream(messageText, assistantMessage.id);
  }

  async function retryMessage(message: ChatMessage) {
    if (isStreaming.value) {
      return;
    }

    const userMessage = messages.value.find(
      (item) => item.id === message.sourceUserMessageId,
    );

    if (!userMessage) {
      return;
    }

    const assistantMessage = createMessage('assistant', '', 'loading', {
      sourceUserMessageId: userMessage.id,
    });

    messages.value.push(assistantMessage);
    activeAssistantId.value = assistantMessage.id;
    await scrollToBottom();
    await startStream(userMessage.content, assistantMessage.id);
  }

  async function startStream(message: string, assistantId: string) {
    const controller = new AbortController();
    currentController.value = controller;

    try {
      await streamChat(
        {
          message,
          conversationId: conversationId.value || undefined,
          context: buildContext(assistantId),
        },
        controller.signal,
        {
          onStart: (data) => {
            conversationId.value = data.conversationId;
            updateAssistant(assistantId, {
              serverId: data.messageId,
            });
          },
          onDelta: (data) => {
            updateAssistant(assistantId, (current) => ({
              content: current.content + data.content,
              status: 'streaming',
            }));
            void followStream();
          },
          onDone: () => {
            updateAssistant(assistantId, {
              status: 'done',
            });
          },
          onError: (data) => {
            updateAssistant(assistantId, {
              status: 'error',
              errorMessage: data.message || '生成失败，请稍后重试。',
            });
          },
        },
      );
    } catch {
      if (!controller.signal.aborted) {
        updateAssistant(assistantId, {
          status: 'error',
          errorMessage: '网络异常，请稍后重试。',
        });
      }
    } finally {
      if (activeAssistantId.value === assistantId) {
        activeAssistantId.value = '';
      }

      if (currentController.value === controller) {
        currentController.value = null;
      }
    }
  }

  function cancelStream() {
    if (!currentController.value || !activeAssistantId.value) {
      return;
    }

    currentController.value.abort();
    updateAssistant(activeAssistantId.value, {
      status: 'canceled',
    });
    activeAssistantId.value = '';
    currentController.value = null;
  }

  function newConversation() {
    if (isStreaming.value) {
      const confirmed = window.confirm('当前回答仍在生成，开启新对话会中断本次生成。');

      if (!confirmed) {
        return;
      }

      cancelStream();
    }

    messages.value = [];
    conversationId.value = '';
    inputText.value = '';
    activeAssistantId.value = '';
    historyItems.value = historyItems.value.map((item) => ({
      ...item,
      active: false,
    }));
    void scrollToBottom();
  }

  function chooseExample(text: string) {
    inputText.value = text;
  }

  async function copyMessage(message: ChatMessage) {
    if (!message.content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(message.content);
      copiedMessageId.value = message.id;
      updateAssistant(message.id, {
        actionMessage: '已复制',
      });
      window.setTimeout(() => {
        if (copiedMessageId.value === message.id) {
          copiedMessageId.value = '';
          updateAssistant(message.id, {
            actionMessage: '',
          });
        }
      }, 1400);
    } catch {
      updateAssistant(message.id, {
        actionMessage: '复制失败，请手动选择文本复制。',
      });
    }
  }

  function buildContext(activeId: string): ChatContextMessage[] {
    return messages.value
      .filter((message) => {
        if (message.id === activeId) {
          return false;
        }

        if (message.role === 'assistant' && message.status === 'error') {
          return false;
        }

        return message.content.trim().length > 0;
      })
      .slice(-20)
      .map((message) => ({
        role: message.role,
        content: message.content,
        status: message.status,
      }));
  }

  function createMessage(
    role: ChatRole,
    content: string,
    status: ChatMessageStatus,
    extra: Partial<ChatMessage> = {},
  ): ChatMessage {
    return {
      id: crypto.randomUUID(),
      role,
      content,
      status,
      createdAt: Date.now(),
      ...extra,
    };
  }

  function updateAssistant(
    id: string,
    patch:
      | Partial<ChatMessage>
      | ((current: ChatMessage) => Partial<ChatMessage>),
  ) {
    const target = messages.value.find((message) => message.id === id);

    if (!target) {
      return;
    }

    const nextPatch = typeof patch === 'function' ? patch(target) : patch;
    Object.assign(target, nextPatch);
  }

  function onScroll() {
    const element = scrollContainer.value;

    if (!element) {
      return;
    }

    isNearBottom.value =
      element.scrollHeight - element.scrollTop - element.clientHeight < 96;
  }

  async function followStream() {
    if (isNearBottom.value) {
      await scrollToBottom();
    }
  }

  async function scrollToBottom() {
    await nextTick();
    const element = scrollContainer.value;

    if (!element) {
      return;
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth',
    });
  }

  function toggleMode() {
    mode.value = mode.value === 'expert' ? 'quick' : 'expert';
  }

  function setMode(nextMode: ChatMode) {
    mode.value = nextMode;
  }

  function setSidebarOpen(open: boolean) {
    sidebarOpen.value = open;
  }

  onBeforeUnmount(() => {
    currentController.value?.abort();
  });

  return {
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
  };
}
