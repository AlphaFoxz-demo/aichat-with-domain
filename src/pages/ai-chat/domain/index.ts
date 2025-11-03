import { createBroadcastEvent, createSingletonAgg } from 'vue-fn/domain';
import { reactive, ref } from 'vue';
import type {
  Conversation,
  QueryBo,
  SseEvent,
  EmittedDrawerEvent,
  CreateMessageOptions,
  FileDetail,
} from './define';
import { createConversation } from './conversation';
import { genId } from './common';
import inferFileBean from './infer-file-bean';

const agg = createSingletonAgg(() => {
  const loadingToastVisible = ref(false);
  const currentFileList = reactive<FileDetail[]>([
    // { id: '123', name: '123.txt', size: 123456, extension: 'txt' },
    // { id: '123', name: '123.txt', size: 123456, extension: 'txt' },
    // { id: '123', name: '123.txt', size: 123456, extension: 'txt' },
  ]);
  const currentConversationId = ref<string | undefined>(undefined);
  const conversationMap = reactive<Record<string, Conversation>>({
    // '2': {
    //   id: '1-1',
    //   title: '展示样例',
    //   running: false,
    //   content: [
    //     {
    //       creator: 'User',
    //       id: '1-1(1)',
    //       fileList: [
    //         { id: '123', name: '123.txt', size: 123456, extension: 'txt' },
    //       ],
    //       text: ['你好'],
    //       status: 'Completed',
    //       done: true,
    //     },
    //   ],
    // },
    // '1': {
    //   id: '1-1',
    //   title: '展示样例',
    //   running: false,
    //   content: [
    //     {
    //       creator: 'User',
    //       id: '1-1(1)',
    //       fileList: [
    //         { id: '123', name: '123.txt', size: 123456, extension: 'txt' },
    //       ],
    //       text: ['你好'],
    //       status: 'Completed',
    //       done: true,
    //     },
    //     {
    //       creator: 'DeepSeek',
    //       id: '1-1(2)',
    //       fileList: [],
    //       text: [
    //         '你好！很高兴见到你！😊',
    //         '你好！很高兴见到你！😊',
    //         '你好！很高兴见到你！😊',
    //         '你好！很高兴见到你！😊',
    //         '你好！很高兴见到你！😊',
    //         '你好！很高兴见到你！😊',
    //         '你好！很高兴见到你！😊',
    //         '你好！很高兴见到你！😊',
    //         '我是DeepSeek，由深度求索公司创造的AI助手。我可以帮你解答问题、处理文档、进行对话交流，还有很多其他功能呢！',
    //         '有什么我可以帮你的吗？无论是学习、工作还是生活上的问题，我都很乐意为你提供帮助！✨',
    //       ],
    //       status: 'Completed',
    //       done: true,
    //     },
    //     {
    //       creator: 'User',
    //       id: '1-1(3)',
    //       fileList: [],
    //       text: ['你好'],
    //       status: 'Completed',
    //       done: true,
    //     },
    //     {
    //       creator: 'DeepSeek',
    //       id: '1-1(4)',
    //       fileList: [],
    //       text: [],
    //       status: 'Running',
    //       done: true,
    //     },
    //   ],
    // },
  });
  const userBarHeight = ref('240rpx');
  const onDrawerOperatedEvent = createBroadcastEvent<EmittedDrawerEvent>();
  const onQueryStartedEvent = createBroadcastEvent<QueryBo>();
  const nickname = ref('');
  const rootFontSize = ref(30.8);
  return {
    states: {
      nickname,
      conversationMap,
      currentFileList,
      currentConversationId,
      userBarHeight,
      rootFontSize,
    },
    commands: {
      fontZoomIn() {
        rootFontSize.value *= 1.5;
        console.debug('fontZoomIn', rootFontSize.value);
      },
      fontZoomOut() {
        rootFontSize.value /= 1.5;
        console.debug('fontZoomOut', rootFontSize.value);
      },
      showLoading(v: string) {
        if (!loadingToastVisible.value) {
          uni.showLoading({ title: v, mask: true });
          loadingToastVisible.value = true;
        }
      },
      hideLoading() {
        if (loadingToastVisible.value) {
          uni.hideLoading();
          loadingToastVisible.value = false;
        }
      },
      showToast(v: string) {
        if (!loadingToastVisible.value) {
          uni.showToast({ title: v, icon: 'none', mask: true });
          loadingToastVisible.value = true;
        }
      },
      hideToast() {
        if (loadingToastVisible.value) {
          uni.hideToast();
          loadingToastVisible.value = false;
        }
      },
      addFile(file: FileDetail) {
        currentFileList.push(file);
      },
      removeFile(file: FileDetail) {
        const index = currentFileList.findIndex((item) => item.id === file.id);
        if (index < 0) {
          return;
        }
        currentFileList.splice(index, 1);
      },
      clearFileList() {
        currentFileList.length = 0;
      },
      setUserBarHeight(height: number) {
        // const compensation = 24;
        const compensation = 600;
        const max = 394 + compensation;
        const min = 102 + compensation;
        height += 76 + compensation; // 加76正文紧贴输入框，在此基础上再加一个高度
        if (height > max) {
          height = max;
        } else if (height < min) {
          height = min;
        }
        userBarHeight.value = `${height}px`;
      },
      setNickname(v: string) {
        nickname.value = v;
      },
      setConversationContextId(
        conversationId: string,
        conversationIdContextId: string
      ) {
        if (conversationMap[conversationId].conversationContextId) {
          return;
        }
        conversationMap[conversationId].conversationContextId =
          conversationIdContextId;
      },
      switchConversationById(id: string | undefined) {
        currentConversationId.value = id;
      },
      deleteConversationById(id: string) {
        currentConversationId.value = undefined;
        delete conversationMap[id];
      },
      query(query: string) {
        const conversationId = currentConversationId.value || genId();
        if (!currentConversationId.value) {
          currentConversationId.value = conversationId;
          conversationMap[conversationId] = createConversation(conversationId);
        }
        conversationMap[conversationId].title = query;
        conversationMap[conversationId].createMessage({
          creator: 'User',
          status: 'Completed',
          fileList: JSON.parse(JSON.stringify(currentFileList)),
          text: [query],
          done: true,
        });
        const bo: QueryBo = {
          conversationId,
          chatContextId: conversationMap[conversationId].conversationContextId!,
          nickname: nickname.value,
          fingerprint: nickname.value,
          query,
          fileList: currentFileList.map((item) => inferFileBean(item)),
        };
        this.conversationCreateMessage(bo.conversationId, {
          creator: 'DeepSeek',
          text: [],
          status: 'Running',
          done: false,
          messageContextId: undefined,
        });
        currentFileList.length = 0;
        onQueryStartedEvent.publish(bo);
      },
      cancelMessage(conversationId: string, messageId: string) {
        const conversation = conversationMap[conversationId];
        if (conversation) {
          const message = conversation.content.find(
            (msg) => msg.id === messageId
          );
          if (message) {
            message.status = 'Cancelled';
          }
        }
      },
      handleEvent(event: SseEvent) {
        console.debug('dify event', event);
      },
      closeDrawer() {
        onDrawerOperatedEvent.publish({ action: 'close' });
      },
      conversationCreateMessage(
        conversationId: string,
        opts: CreateMessageOptions
      ) {
        conversationMap[conversationId].createMessage(opts);
      },
      conversationStartWorkflow(conversationId: string) {
        conversationMap[conversationId].startWorkflow();
      },
      conversationFinishWorkflow(conversationId: string) {
        conversationMap[conversationId].finishWorkflow();
      },
      conversationStartNode(conversationId: string) {
        conversationMap[conversationId].startNode();
      },
      conversationFinishNode(conversationId: string) {
        conversationMap[conversationId].finishNode();
      },
      conversationOnMessage(conversationId: string, text: string) {
        conversationMap[conversationId].onMessage(text);
      },
      conversationOnError(conversationId: string) {
        conversationMap[conversationId].onError();
      },
    },
    events: {
      onDrawerOperatedEvent,
      onQueryStartedEvent,
    },
  };
});

export function useAiChatAgg() {
  return agg.api;
}
